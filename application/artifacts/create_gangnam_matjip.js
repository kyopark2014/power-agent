
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');

// 공통 테두리 스타일
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

// 헤더 행 생성 함수
function makeHeaderRow(texts, colWidths, bgColor = "2E75B6") {
  return new TableRow({
    tableHeader: true,
    children: texts.map((text, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
        })]
      })
    )
  });
}

// 데이터 행 생성 함수
function makeDataRow(texts, colWidths, bgColor = "FFFFFF") {
  return new TableRow({
    children: texts.map((text, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text, size: 20, font: "Arial" })]
        })]
      })
    )
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
          children: [new TextRun({ text: "강남역 맛집 추천 가이드", bold: true, size: 22, font: "Arial", color: "2E75B6" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, font: "Arial", color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "888888" }),
            new TextRun({ text: " / ", size: 18, font: "Arial", color: "888888" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial", color: "888888" }),
          ]
        })]
      })
    },
    children: [
      // ── 메인 제목 ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "강남역 맛집 추천 리스트", bold: true, size: 48, font: "Arial", color: "1F4E79" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: "2024년 기준 | 네이버 & 구글 플레이스 종합", size: 20, font: "Arial", color: "888888" })]
      }),

      // ── 섹션 1: 고기/구이류 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "고기 / 구이류", font: "Arial" })] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 4160, 2400],
        rows: [
          makeHeaderRow(["맛집 이름", "특징", "위치"], [2800, 4160, 2400]),
          makeDataRow(["감탄성신 강남점", "인기 고기 맛집, 내돈내산 베스트", "강남대로106길 14"], [2800, 4160, 2400], "EBF3FB"),
          makeDataRow(["강남 돼지상회", "삼겹살·가브리살·껍데기 무한리필", "강남대로98길 11"], [2800, 4160, 2400], "FFFFFF"),
          makeDataRow(["동두천솥뚜껑삼겹살", "솥뚜껑 삼겹살 1위 맛집", "강남"], [2800, 4160, 2400], "EBF3FB"),
        ]
      }),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // ── 섹션 2: 양식/이탈리안 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "양식 / 이탈리안", font: "Arial" })] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          makeHeaderRow(["맛집 이름", "특징"], [2800, 6560]),
          makeDataRow(["마녀주방", "파스타·피자·스테이크, 가성비 레스토랑 (구글 4.2점)"], [2800, 6560], "EBF3FB"),
          makeDataRow(["어거스트힐", "스테이크 전문 레스토랑 (구글 4.3점)"], [2800, 6560], "FFFFFF"),
          makeDataRow(["바비레드", "이탈리안 레스토랑 강남 본점 (구글 4.3점)"], [2800, 6560], "EBF3FB"),
          makeDataRow(["미도인", "등심 스테이크·바질 크림 새우 파스타, 2만원 이하 가성비"], [2800, 6560], "FFFFFF"),
        ]
      }),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // ── 섹션 3: 한식/국물 요리 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "한식 / 국물 요리", font: "Arial" })] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          makeHeaderRow(["맛집 이름", "특징"], [2800, 6560]),
          makeDataRow(["옥된장 역삼점", "수육무침·수육전골 인기"], [2800, 6560], "EBF3FB"),
          makeDataRow(["영동설렁탕", "24시간 운영, 정통 설렁탕"], [2800, 6560], "FFFFFF"),
          makeDataRow(["농민백암순대", "진짜 맛있는 순대국 맛집"], [2800, 6560], "EBF3FB"),
          makeDataRow(["시골야채된장", "된장찌개 전문"], [2800, 6560], "FFFFFF"),
        ]
      }),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // ── 섹션 4: 기타 인기 맛집 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "기타 인기 맛집", font: "Arial" })] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          makeHeaderRow(["맛집 이름", "특징"], [2800, 6560]),
          makeDataRow(["하이디라오", "유명 중국식 훠궈 체인 (구글 4.2점)"], [2800, 6560], "EBF3FB"),
          makeDataRow(["땀땀", "베트남 쌀국수 전문점 (구글 4.1점)"], [2800, 6560], "FFFFFF"),
          makeDataRow(["장인닭갈비 강남점", "닭갈비 전문"], [2800, 6560], "EBF3FB"),
          makeDataRow(["고베규카츠", "일본식 규카츠 전문점"], [2800, 6560], "FFFFFF"),
        ]
      }),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // ── 꿀팁 섹션 ──
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "꿀팁!", font: "Arial" })] }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "점심 특선을 노리면 더 저렴하게 즐길 수 있어요!", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "회식·모임엔 하이디라오나 강남 돼지상회 무한리필 추천!", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "데이트엔 어거스트힐, 바비레드 같은 분위기 있는 레스토랑이 딱이에요!", size: 22, font: "Arial" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "혼밥엔 고베규카츠나 영동설렁탕이 편하게 먹기 좋아요!", size: 22, font: "Arial" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("artifacts/강남역_맛집_추천_v2.docx", buffer);
  console.log("저장 완료: artifacts/강남역_맛집_추천_v2.docx");
});
