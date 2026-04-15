# 전력 거래 솔루션을 위한 Agent

여기서는 전력 거래 솔루션을 위한 Agent의 개발 및 테스트를 위한 주요 기술에 대해 설명합니다.

## Agent 구현

[app.py](./application/app.py)은 streamlit 환경에서 agent를 실행할 수 있게 합니다. 아래와 같이 [chat.py](./application/chat.py)의 run_langgraph_agent()을 실행합니다. 사용자가 선택한 MCP server의 리스트는 mcp_servers를 제공하고 chat history를 이용시 history_mode을 enable로 설정합니다. containers는 streamlit UI를 위헤 전달됩니다.

```python
response, artifacts = asyncio.run(chat.run_langgraph_agent(
    query=prompt, 
    mcp_servers=mcp_servers, 
    history_mode=history_mode, 
    containers=containers))
```

Agent의 생성은 아래와 같이 진행합니다. 여기서 get_builtin_tools()은 agent 동작에 필요한 tool을 등록합니다. load_selected_config()을 이용해 mcp.json을 생성한 후에 server param을 생성하여 [MultiServerMCPClient](https://reference.langchain.com/python/langchain-mcp-adapters/client/MultiServerMCPClient)으로 client를 생성합니다. get_tools()을 이용하여 tool 정보를 가져와서 추가합니다. Skill에 필요한 tool은 get_skill_tools()로 추가하고, skill을 위한 prompt는 build_skill_prompt()을 이용해 가져옵니다.

```python
async def create_agent(mcp_servers: list, history_mode: str="Disable") -> tuple[str, list]:
    tools = langgraph_agent.get_builtin_tools()        
    mcp_json = mcp_config.load_selected_config(mcp_servers)

    server_params = langgraph_agent.load_multiple_mcp_server_parameters(mcp_json)
    client = MultiServerMCPClient(server_params)    
    mcp_tools = await client.get_tools()
    tools.append(mcp_tools) 

    tools.extend(skill.get_skill_tools())
    skill_info = skill.selected_skill_info("base")
    system_prompt = skill.build_skill_prompt(skill_info)
        
    app = langgraph_agent.buildChatAgentWithHistory(tools)
    config = {
        "recursion_limit": 100,
        "configurable": {"thread_id": user_id},
        "tools": tools,
        "system_prompt": system_prompt
    }    
    return app, config
```

아래와 같이 agent를 생성하고 stream()으로 실행합니다. 텍스트는 result로 전달되고 tool이 생성하는 이미지등은 artifacts로 전달됩니다.

```python
app, config = await create_agent(mcp_servers, history_mode)

async for stream in app.astream(inputs, config, stream_mode="messages"):
    if isinstance(stream[0], AIMessageChunk):
        message = stream[0]    
        input = {}        
        if isinstance(message.content, list):
            for content_item in message.content:
                if isinstance(content_item, dict):
                    if content_item.get('type') == 'text':
                        text_content = content_item.get('text', '')
                        
                        if tool_used:
                            result = text_content
                            tool_used = False
                        else:
                            result += text_content
                        update_streaming_result(containers, result, "markdown")

                    elif content_item.get('type') == 'tool_use':
                        if 'id' in content_item and 'name' in content_item:
                            toolUseId = content_item.get('id', '')
                            tool_name = content_item.get('name', '')
                            if queue:
                                queue.register_tool(toolUseId, tool_name)
                                                                
                        if 'partial_json' in content_item:
                            partial_json = content_item.get('partial_json', '')
                            
                            if toolUseId not in tool_input_list:
                                tool_input_list[toolUseId] = ""                                
                            tool_input_list[toolUseId] += partial_json
                            input = tool_input_list[toolUseId]

                            if queue:
                                queue.tool_update(toolUseId, f"Tool: {tool_name}, Input: {input}")
                    
    elif isinstance(stream[0], ToolMessage):
        message = stream[0]
        tool_name = message.name
        toolResult = message.content
        toolUseId = message.tool_call_id
        add_notification(containers, f"Tool Result: {toolResult}")
        tool_used = True
        
        content, urls, refs = get_tool_info(tool_name, toolResult)
        if refs:
            for r in refs:
                references.append(r)
        if urls:
            for url in urls:
                artifacts.append(url)
    return result, artifacts
```    

## MCP 구현

[mcp_server_retrieve.py](./application/mcp_server_retrieve.py)와 같이 MCP server를 구현합니다. 

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name = "mcp-retrieve")

@mcp.tool()
def retrieve(keyword: str) -> str:
    """
    Query the keyword using RAG based on the knowledge base.
    keyword: the keyword to query
    return: the result of query
    """
    return mcp_retrieve.retrieve(keyword)

if __name__ =="__main__":
    mcp.run(transport="stdio")
```


## SKILL 구현

[Agent Skill Specification](https://agentskills.io/specification)와 같이 skill은 SKILL.md에 instruction을 정의하고, scripts를 이용해 구동됩니다. 이때 assets나 references를 같이 활용할 수 있습니다.

```bash
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

Skill 정보는 system prompt에 포함되어 제공됩니다. 아래와 같이 SKILL_SYSTEM_PROMPT은 skill 사용에 대한 기본 prompt를 제공하고, SKILL_USAGE_GUIDE은 skill 사용을 위한 가이드를 포함합니다.

```python
SKILL_SYSTEM_PROMPT = (
    "당신의 이름은 서연이고, 질문에 친근한 방식으로 대답하도록 설계된 대화형 AI입니다.\n"
    "상황에 맞는 구체적인 세부 정보를 충분히 제공합니다.\n"
    "모르는 질문을 받으면 솔직히 모른다고 말합니다.\n"
    "한국어로 답변하세요.\n\n"
    "## Agent Workflow\n"
    "1. 사용자 입력을 받는다\n"
    "2. 요청에 맞는 skill이 있으면 get_skill_instructions 도구로 상세 지침을 로드한다\n"
    "3. skill 지침에 따라 execute_code, write_file 등의 도구를 사용하여 작업을 수행한다\n"
    "4. 결과 파일이 있으면 upload_file_to_s3로 업로드하여 URL을 제공한다\n"
    "5. 최종 결과를 사용자에게 전달한다\n\n"
)

SKILL_USAGE_GUIDE = (
    "\n## Skill 사용 가이드\n"
    "위의 <available_skills>에 나열된 skill이 사용자의 요청과 관련될 때:\n"
    "1. 먼저 get_skill_instructions 도구로 해당 skill의 상세 지침을 로드하세요.\n"
    "2. **중요: 지침을 읽기 전에 어떤 작업을 할지 단정짓지 마세요.** "
    "skill의 description에 서브커맨드(query, path, explain 등)가 있다면, "
    "사용자 명령의 서브커맨드를 정확히 파악한 후 그에 맞는 동작을 설명하세요.\n"
    "3. 지침에 포함된 코드 패턴을 execute_code 도구로 실행하세요.\n"
    "4. skill 지침이 없는 일반 질문은 직접 답변하세요.\n"
)
```

Agent를 생성할 때에 build_skill_prompt()을 이용해 skill 정보를 가져옵니다. build_skill_prompt()에서는 아래와 같이 SKILL_SYSTEM_PROMPT, path_info, skills_xml, SKILL_USAGE_GUIDE으로 system prompt를 생성합니다. path_info는 skill.md의 위치와 skill이 생성할 artifact의 위치를 지정하고, skills_xml은 skill에 대한 정보를 제공합니다.

```python
def build_skill_prompt(skill_info: list) -> str:
    """Build skill-related prompt: path info, available skills XML, and usage guide."""
        
    path_info = (
        f"## Paths (use absolute paths for write_file, read_file)\n"
        f"- WORKING_DIR: {WORKING_DIR}\n"
        f"- ARTIFACTS_DIR: {ARTIFACTS_DIR}\n"
        f"Example: write_file(filepath='{os.path.join(ARTIFACTS_DIR, 'report.drawio')}', content='...')\n\n"
    )

    skills_xml = get_skills_xml(skill_info)
    if skills_xml:
        return f"{SKILL_SYSTEM_PROMPT}\n{path_info}\n{skills_xml}\n{SKILL_USAGE_GUIDE}"
    return f"{SKILL_SYSTEM_PROMPT}\n{path_info}"
```

skills_xml은 아래와 같이 SKILL.md의 name, description 정보를 포함하고, agent가 적절한 skill을 선택할 수 있는 정보를 제공합니다.

```python
def get_skills_xml(skill_info: list) -> str:
    lines = ["<available_skills>"]
    for s in skill_info:
        lines.append("  <skill>")
        lines.append(f"    <name>{s['name']}</name>")
        lines.append(f"    <description>{s['description']}</description>")
        lines.append("  </skill>")
    lines.append("</available_skills>")
    return "\n".join(lines)
```

## 설치

### 사전 준비

1. AWS 환경을 활용하기 위해서 [AWS CLI를 설치](https://docs.aws.amazon.com/ko_kr/cli/v1/userguide/cli-chap-install.html)을 Local에 설치합니다. 설치시 아래 명령어를 참조합니다.

```text
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" 
unzip awscliv2.zip
sudo ./aws/install
```

AWS CLI를 이용해 AWS credential을 아래와 같이 등록합니다.

```text
aws configure
```

2. 설치하다가 발생하는 각종 문제는 [Kiro-cli](https://aws.amazon.com/ko/blogs/korea/kiro-general-availability/)를 이용해 빠르게 수정합니다. Mac/Linux에서는 아래와 같이 설치합니다.

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

Windows에서는 아래와 같이 설치합니다. 상세한 정보는 [Kiro-CLI](https://kiro.dev/cli/)를 참조합니다.

```bash
irm 'https://cli.kiro.dev/install.ps1' | iex
```

venv로 환경을 구성할때에는 아래와 같이 환경을 설정합니다. (옵션)

```text
python -m venv .venv
source .venv/bin/activate
```

3. [knowledge-base-with-s3-vector.md](./knowledge-base-with-s3-vector.md)에 따라 AWS의 완전관리형 RAG 서비스인 Knowledge Base를 설치합니다. Vector Store로 S3 Vector를 선택하면 embedding된 문서 정보가 Amazon S3에 저장되므로 경제적입니다. 다만 성능을 최적화하기 원할때에는 S3 Vector 보다는 OpenSearch Serverless등을 활용합니다.

4. 인터넷 검색을 위하여 [Tavily Search](https://app.tavily.com/sign-in)에 접속하여 가입 후 API Key를 발급합니다. 이것은 tvly-로 시작합니다. 

5. git code를 다운로드합니다.

```bash
git clone https://github.com/kyopark2014/power-agent
```

6. 아래 명령어로 config.json을 생성합니다. 이때 앞에서 생성한 "S3 bucket name", "Knowledge Base ID", "Tavily API Key"을 입력합니다.

```bash
python update_config.py
```

7. 다운로드 받은 github 폴더로 이동한 후에 아래와 같이 필요한 패키지를 설치 합니다.

```bash
pip install -r requirements.txt
```

8. MCP `web_fetch`(`mcp-server-fetch-typescript`, Playwright 포함), Word 문서 생성(`docx` 패키지, docx-js) 등을 쓰려면 저장소 루트에서 아래 명령으로 Node 패키지를 설치합니다.

```bash
npm install
```

렌더된 HTML을 가져오는 도구를 쓸 때는 최초 한 번 `npx playwright install`으로 브라우저 바이너리를 설치해야 할 수 있습니다.

### 실행

```text
streamlit run application/app.py
```

## 결과

"contents/stock_prices.csv를 읽어서 그래프로 그리고 설명하세요."라고 입력후 결과를 확인합니다.

이때의 결과는 아래와 같습니다.

<img width="913" height="713" alt="image" src="https://github.com/user-attachments/assets/bbe9a968-d1bc-4eaa-a0e3-6b2587c00c37" />

이어서 "결과를 Word 파일로 정리해주세요."라고 하면 Word 파일로 저장할 수 있습니다. 이때의 결과의 예는 [stock_analysis_report.docx](./application/contents/stock_analysis_report.docx)입니다.



