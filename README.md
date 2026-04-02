# 전력 거래 솔루션을 위한 Agent

여기서는 전력 거래 솔루션을 위한 Agent의 개발 및 기능 테스트를 위한 Agent를 구현합니다.

## 설치

### Knowledge Base

여기에서는 AWS의 완전관리형 RAG 서비스인 Knowledge Base를 활용하는 방법에 대해 설명합니다.

1. 문서를 저장하기 위해 Amazon S3를 생성합니다. [Amazon S3 Console](https://us-west-2.console.aws.amazon.com/s3/home?region=us-west-2#)에 접속해서, [Create bucket]을 선택한 후에 아래와 같이 [Bucket name]을 입력하고 나머지 설정은 그대로 유지한 상태에서 [Create]를 선택합니다. 이때 bucket의 이름은 반드시 unique한 이름이어야 합니다.

<img width="480" height="91" alt="image" src="https://github.com/user-attachments/assets/84b45e0d-21fd-4174-8de2-e809812bf939" />

2. [Knolwedge Base Console](https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/knowledge-bases)에 접속하여 [Create]를 선택합니다. 이때, 아래와 같이 [Knowledbe Base with vector store]를 선택합니다.

<img width="615" height="205" alt="image" src="https://github.com/user-attachments/assets/756ef7c4-720a-4817-8864-d4ce31413a3e" />

3. 아래와 같이 이름을 입력합니다. 이후 하단으로 이동하여 [Next]를 선택합니다. 이때 [IAM permissions]은 기본값인 "Create and use a new service role"이 선택되고, [Choose data source type]은 "Amazon S3"가 선택됩니다.

<img width="599" height="130" alt="image" src="https://github.com/user-attachments/assets/8b83272b-d709-4dbf-a77e-586c6e3a0cfb" />

4. [Configure data source]에서도 기본값을 유지한 상태에서 하단의 [Next] 선택합니다. 
   
5. 

### 사전 준비

1. 인터넷 검색을 위하여 [Tavily Search](https://app.tavily.com/sign-in)에 접속하여 가입 후 API Key를 발급합니다. 이것은 tvly-로 시작합니다.  
2. git code를 다운로드합니다.
```text
git clone https://github.com/kyopark2014/power-agent
```
3. 아래 명령어로 config.json을 생성합니다.
```text
python update_config.py
```
4. 필요한 패키지를 설치합니다.
```text
pip install -r requirement.txt 
```



### 실행

```text
streamlit run application/app.py
```

## 결과

"contents/stock_prices.csv를 읽어서 그래프로 그리고 설명하세요."라고 입력후 결과를 확인합니다.
