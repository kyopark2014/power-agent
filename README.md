# 전력 거래 솔루션을 위한 Agent

여기서는 전력 거래 솔루션을 위한 Agent의 개발 및 기능 테스트를 위한 Agent를 구현합니다.

## 설치

### 사전 준비

1. [knowledge-base-with-s3-vector.md](./knowledge-base-with-s3-vector.md)에 따라 AWS의 완전관리형 RAG 서비스인 Knowledge Base를 설치합니다. Vector Store로 S3 Vector를 선택하면 embedding된 문서 정보가 Amazon S3에 저장되므로 매우 경제적입니다. 다만 성능을 최적화하기 원할때에는 S3 Vector 보다는 OpenSearch Serverless등을 활용합니다.

2. 인터넷 검색을 위하여 [Tavily Search](https://app.tavily.com/sign-in)에 접속하여 가입 후 API Key를 발급합니다. 이것은 tvly-로 시작합니다.  

3. git code를 다운로드합니다.

```text
git clone https://github.com/kyopark2014/power-agent
```

4. 아래 명령어로 config.json을 생성합니다. 이때 앞에서 생성한 "S3 bucket name", "Knowledge Base ID", "Tavily API Key"을 입력합니다.

```text
python update_config.py
```

5. 필요한 패키지를 설치합니다.
```text
pip install -r requirement.txt 
```

### 실행

```text
streamlit run application/app.py
```

## 결과

"contents/stock_prices.csv를 읽어서 그래프로 그리고 설명하세요."라고 입력후 결과를 확인합니다.
