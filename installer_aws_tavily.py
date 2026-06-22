#!/usr/bin/env python3
"""
Install/update the shared aws-tavily AgentCore runtime (Marketplace Tavily MCP container).

Runtime name and region are fixed so other projects (aws-tavily, power-runtime, etc.)
can reuse the same runtime:
  - agent_runtime_aws_tavily
  - us-east-1
"""

import json
import os
import sys
import time

import boto3
from botocore.exceptions import ClientError

ROLE_VALIDATION_MAX_RETRIES = 4
ROLE_VALIDATION_BASE_DELAY_SEC = 5
ROLE_VALIDATION_MAX_DELAY_SEC = 15

script_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(script_dir, "application", "config.json")

DEFAULT_TAVILY_CONTAINER_IMAGE_URI = (
    "709825985650.dkr.ecr.us-east-1.amazonaws.com/tavily/tavily-mcp:v0.1.2"
)
AWS_TAVILY_RUNTIME_NAME = "agent_runtime_aws_tavily"
AWS_TAVILY_RUNTIME_REGION = "us-east-1"


def load_config():
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to parse {config_path}: {e}")
        config = {}
        session = boto3.Session()
        config["region"] = session.region_name or "us-west-2"
        config["projectName"] = "power-trade"

        sts = boto3.client("sts")
        config["accountId"] = sts.get_caller_identity()["Account"]

        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return config


def update_config(key, value):
    try:
        config = load_config()
        config[key] = value
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error updating config: {e}")
        return False


def get_tavily_container_image_uri(config):
    return config.get("tavily_container_image_uri", DEFAULT_TAVILY_CONTAINER_IMAGE_URI)


def _load_tavily_api_key(config):
    key = config.get("tavily_api_key") or os.environ.get("TAVILY_API_KEY")
    if key:
        return key

    project_name = config.get("projectName", "power-trade")
    secret_name = f"tavilyapikey-{project_name}"
    secrets_region = config.get("region", "us-west-2")
    secrets_client = boto3.client("secretsmanager", region_name=secrets_region)
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_data = json.loads(response["SecretString"])
        key = secret_data.get("tavily_api_key", "")
        if key:
            print(f"✓ Tavily API key loaded from Secrets Manager: {secret_name}")
            return key
    except Exception as e:
        print(f"Could not load Tavily secret {secret_name}: {e}")
    return ""


def get_tavily_runtime_environment_variables(config):
    api_key = _load_tavily_api_key(config)
    if not api_key:
        print(
            "Warning: TAVILY_API_KEY is not set (config, env, or Secrets Manager). "
            "Tavily search will not work in aws-tavily AgentCore runtime."
        )
        return None
    return {"TAVILY_API_KEY": api_key}


def get_mcp_protocol_configuration():
    return {"serverProtocol": "MCP"}


def create_bedrock_agentcore_policy(config):
    region = config["region"]
    account_id = config["accountId"]
    project_name = config.get("projectName", "power-trade")
    policy_name = f"AmazonBedrockAgentCoreRuntimePolicyFor{project_name}"

    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "BedrockAgentAccess",
                "Effect": "Allow",
                "Action": ["bedrock-agentcore:*"],
                "Resource": ["*"],
            },
            {
                "Sid": "SecretsManagerAccess",
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                ],
                "Resource": [
                    f"arn:aws:secretsmanager:{region}:*:secret:tavilyapikey-{project_name}*",
                ],
            },
            {
                "Sid": "ECRAccess",
                "Effect": "Allow",
                "Action": [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchGetImage",
                    "ecr:GetDownloadUrlForLayer",
                ],
                "Resource": "*",
            },
            {
                "Sid": "LogsAccess",
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                ],
                "Resource": [
                    f"arn:aws:logs:{AWS_TAVILY_RUNTIME_REGION}:*:log-group:/aws/bedrock-agentcore/*",
                    f"arn:aws:logs:{AWS_TAVILY_RUNTIME_REGION}:*:log-group:/aws/bedrock-agentcore/*:log-stream:*",
                ],
            },
        ],
    }

    iam_client = boto3.client("iam")
    policy_arn = f"arn:aws:iam::{account_id}:policy/{policy_name}"
    try:
        existing = iam_client.get_policy(PolicyArn=policy_arn)
        versions = iam_client.list_policy_versions(PolicyArn=policy_arn)["Versions"]
        if len(versions) >= 5:
            for version in versions:
                if not version["IsDefaultVersion"]:
                    iam_client.delete_policy_version(
                        PolicyArn=policy_arn,
                        VersionId=version["VersionId"],
                    )
                    break
        iam_client.create_policy_version(
            PolicyArn=policy_arn,
            PolicyDocument=json.dumps(policy_document),
            SetAsDefault=True,
        )
        print(f"✓ Policy updated: {policy_arn}")
        return policy_arn
    except iam_client.exceptions.NoSuchEntityException:
        response = iam_client.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description="Policy for aws-tavily Bedrock AgentCore runtime",
        )
        print(f"✓ Policy created: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]


def create_trust_policy_for_bedrock(config):
    account_id = config["accountId"]
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AssumeRolePolicy",
                "Effect": "Allow",
                "Principal": {"Service": "bedrock-agentcore.amazonaws.com"},
                "Action": "sts:AssumeRole",
                "Condition": {
                    "StringEquals": {"aws:SourceAccount": account_id},
                    "ArnLike": {
                        "aws:SourceArn": (
                            f"arn:aws:bedrock-agentcore:{AWS_TAVILY_RUNTIME_REGION}:"
                            f"{account_id}:*"
                        )
                    },
                },
            }
        ],
    }


def create_bedrock_agentcore_role(config):
    project_name = config.get("projectName", "power-trade")
    role_name = f"AmazonBedrockAgentCoreRuntimeRoleFor{project_name}"
    policy_arn = create_bedrock_agentcore_policy(config)
    if not policy_arn:
        return None

    iam_client = boto3.client("iam")
    trust_policy = create_trust_policy_for_bedrock(config)
    try:
        existing = iam_client.get_role(RoleName=role_name)
        iam_client.update_assume_role_policy(
            RoleName=role_name,
            PolicyDocument=json.dumps(trust_policy),
        )
        iam_client.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
        print(f"✓ Role updated: {existing['Role']['Arn']}")
        return existing["Role"]["Arn"]
    except iam_client.exceptions.NoSuchEntityException:
        response = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description="Role for aws-tavily Bedrock AgentCore runtime",
        )
        iam_client.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
        print(f"✓ Role created: {response['Role']['Arn']}")
        return response["Role"]["Arn"]


def create_iam_policies():
    print(f"\n{'=' * 60}")
    print("Creating IAM policies and roles for aws-tavily")
    print(f"{'=' * 60}")
    config = load_config()
    role_arn = create_bedrock_agentcore_role(config)
    if not role_arn:
        return False
    update_config("agent_runtime_role", role_arn)
    return True


def _is_role_validation_error(error, role_arn):
    if not isinstance(error, ClientError):
        return False
    code = error.response.get("Error", {}).get("Code", "")
    message = error.response.get("Error", {}).get("Message", "")
    if code == "InvalidParameterValueException" and "cannot be assumed" in message:
        return True
    return (
        code == "ValidationException"
        and "Role validation failed" in message
        and role_arn in message
    )


def _call_with_role_validation_retry(operation, role_arn, action_label):
    for attempt in range(ROLE_VALIDATION_MAX_RETRIES + 1):
        try:
            return operation()
        except ClientError as error:
            if not _is_role_validation_error(error, role_arn) or attempt == ROLE_VALIDATION_MAX_RETRIES:
                raise
            delay = min(
                ROLE_VALIDATION_BASE_DELAY_SEC * (2**attempt),
                ROLE_VALIDATION_MAX_DELAY_SEC,
            )
            print(
                f"IAM role not ready yet ({action_label}), "
                f"retrying in {delay}s ({attempt + 1}/{ROLE_VALIDATION_MAX_RETRIES})..."
            )
            time.sleep(delay)


def create_aws_tavily_runtime_func(config, runtime_name, container_uri):
    agent_runtime_role = config.get("agent_runtime_role")
    if not agent_runtime_role:
        print("Error: agent_runtime_role not found in application/config.json")
        return None

    client = boto3.client(
        "bedrock-agentcore-control", region_name=AWS_TAVILY_RUNTIME_REGION
    )

    def _create():
        kwargs = {
            "agentRuntimeName": runtime_name,
            "agentRuntimeArtifact": {
                "containerConfiguration": {"containerUri": container_uri}
            },
            "networkConfiguration": {"networkMode": "PUBLIC"},
            "roleArn": agent_runtime_role,
            "protocolConfiguration": get_mcp_protocol_configuration(),
        }
        env = get_tavily_runtime_environment_variables(config)
        if env:
            kwargs["environmentVariables"] = env
        return client.create_agent_runtime(**kwargs)

    response = _call_with_role_validation_retry(
        _create, agent_runtime_role, "create aws-tavily agent runtime"
    )
    print(f"✓ aws-tavily agent runtime created: {response['agentRuntimeArn']}")
    return response["agentRuntimeArn"]


def update_aws_tavily_runtime_func(config, runtime_name, agent_runtime_id, container_uri):
    agent_runtime_role = config.get("agent_runtime_role")
    if not agent_runtime_role:
        print("Error: agent_runtime_role not found in application/config.json")
        return None

    client = boto3.client(
        "bedrock-agentcore-control", region_name=AWS_TAVILY_RUNTIME_REGION
    )

    def _update():
        kwargs = {
            "agentRuntimeId": agent_runtime_id,
            "description": "Update aws-tavily agent runtime (MCP + Tavily API key)",
            "agentRuntimeArtifact": {
                "containerConfiguration": {"containerUri": container_uri}
            },
            "roleArn": agent_runtime_role,
            "networkConfiguration": {"networkMode": "PUBLIC"},
            "protocolConfiguration": get_mcp_protocol_configuration(),
        }
        env = get_tavily_runtime_environment_variables(config)
        if env:
            kwargs["environmentVariables"] = env
        return client.update_agent_runtime(**kwargs)

    response = _call_with_role_validation_retry(
        _update, agent_runtime_role, "update aws-tavily agent runtime"
    )
    print(f"✓ aws-tavily agent runtime updated: {response['agentRuntimeArn']}")
    return response["agentRuntimeArn"]


def create_aws_tavily_runtime():
    print(f"\n{'=' * 60}")
    print("Creating/updating aws-tavily AgentCore runtime")
    print(f"{'=' * 60}")

    config = load_config()
    runtime_name = AWS_TAVILY_RUNTIME_NAME
    container_uri = get_tavily_container_image_uri(config)
    update_config("tavily_container_image_uri", container_uri)

    print(f"Runtime name: {runtime_name}")
    print(f"Region: {AWS_TAVILY_RUNTIME_REGION}")
    print(f"Container image: {container_uri}")

    client = boto3.client(
        "bedrock-agentcore-control", region_name=AWS_TAVILY_RUNTIME_REGION
    )
    response = client.list_agent_runtimes()
    agent_runtime_id = None
    for agent_runtime in response.get("agentRuntimes", []):
        if agent_runtime["agentRuntimeName"] == runtime_name:
            print(f"aws-tavily agent runtime {runtime_name} already exists")
            agent_runtime_id = agent_runtime["agentRuntimeId"]
            break

    if agent_runtime_id:
        agent_runtime_arn = update_aws_tavily_runtime_func(
            config, runtime_name, agent_runtime_id, container_uri
        )
    else:
        agent_runtime_arn = create_aws_tavily_runtime_func(
            config, runtime_name, container_uri
        )

    if not agent_runtime_arn:
        print("Error: Failed to create/update aws-tavily agent runtime")
        return False

    update_config("aws_tavily_agent_runtime_arn", agent_runtime_arn)
    print("\n✓ aws-tavily agent runtime creation/update completed")
    return True


def main():
    print("\n" + "=" * 60)
    print("aws-tavily AgentCore Runtime Installer (power-agent)")
    print("=" * 60)

    config = load_config()
    print(f"  - Project Name: {config.get('projectName')}")
    print(f"  - Config Region: {config.get('region')}")
    print(f"  - Runtime Region: {AWS_TAVILY_RUNTIME_REGION}")
    print(f"  - Runtime Name: {AWS_TAVILY_RUNTIME_NAME}")

    steps = [
        ("Creating IAM policies and roles", create_iam_policies),
        ("Creating/updating aws-tavily AgentCore runtime", create_aws_tavily_runtime),
    ]

    for step_name, step_func in steps:
        if not step_func():
            print(f"\nInstallation failed at step: {step_name}")
            sys.exit(1)

    config = load_config()
    print("\n" + "=" * 60)
    print("aws-tavily installation completed successfully!")
    print("=" * 60)
    if config.get("agent_runtime_role"):
        print(f"AgentCore Runtime Role: {config['agent_runtime_role']}")
    if config.get("aws_tavily_agent_runtime_arn"):
        print(f"aws-tavily Runtime ARN: {config['aws_tavily_agent_runtime_arn']}")


if __name__ == "__main__":
    main()
