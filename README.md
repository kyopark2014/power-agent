# 전력 거래 솔루션을 위한 Agent

여기서는 전력 거래 솔루션을 위한 Agent의 개발 및 테스트를 위한 주요 기술에 대해 설명합니다.

## MCP 활용



## SKILL 활용


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

Windows에서는 아래와 같이 설치합니다. 필요한 정보는 [Kiro-CLI](https://kiro.dev/cli/)를 참조합니다.

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



