# 전력 거래 솔루션을 위한 Agent

여기서는 전력 거래 솔루션을 위한 Agent의 개발 및 기능 테스트를 위한 Agent를 구현합니다.

## 사전 준비

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
