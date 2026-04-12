const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "888888" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

function makeHeaderCell(text, width) {
  return new TableCell({
    borders: headerBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "2E75B6", type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
    })]
  });
}

function makeCell(text, width, shade) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: shade || "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, font: "Arial" })]
    })]
  });
}

function makeTable(rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows
  });
}

// 고기/삼겹살 테이블
const meatRows = [
  new TableRow({ children: [makeHeaderCell("식당명", 2800), makeHeaderCell("특징", 6200)] }),
  new TableRow({ children: [makeCell("동두천솥뚜껑삼겹살", 2800, "F5F5F5"), makeCell("강남 맛집 랭킹 1위, 솥뚜껑에 구워 먹는 삼겹살", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("강남 돼지상회", 2800), makeCell("삼겹살·가브리살·갈매기살·껍데기 무한리필", 6200)] }),
  new TableRow({ children: [makeCell("감탄성신 강남점", 2800, "F5F5F5"), makeCell("내돈내산 강추 고기집, 강남대로106길 위치", 6200, "F5F5F5")] }),
];

// 한식 테이블
const koreanRows = [
  new TableRow({ children: [makeHeaderCell("식당명", 2800), makeHeaderCell("특징", 6200)] }),
  new TableRow({ children: [makeCell("옥된장 역삼점", 2800, "F5F5F5"), makeCell("수육무침·수육전골 맛집, 브레이크타임 15:00~16:30", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("농민백암순대", 2800), makeCell("진한 순대국 맛집, 역삼로 위치", 6200)] }),
  new TableRow({ children: [makeCell("영동설렁탕", 2800, "F5F5F5"), makeCell("24시간 운영, 정통 설렁탕", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("시골야채된장", 2800), makeCell("가정식 느낌의 된장 전문점", 6200)] }),
];

// 양식/이탈리안 테이블
const westernRows = [
  new TableRow({ children: [makeHeaderCell("식당명", 2800), makeHeaderCell("특징", 6200)] }),
  new TableRow({ children: [makeCell("마녀주방 강남점", 2800, "F5F5F5"), makeCell("파스타·피자·스테이크, 가성비 레스토랑 (구글 평점 4.2)", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("바비레드 강남본점", 2800), makeCell("이탈리안 레스토랑 (구글 평점 4.3)", 6200)] }),
  new TableRow({ children: [makeCell("어거스트힐 강남점", 2800, "F5F5F5"), makeCell("스테이크 전문 레스토랑 (구글 평점 4.3)", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("미도인", 2800), makeCell("등심 스테이크·바질 크림 새우 파스타, 2만원 이하 가성비", 6200)] }),
];

// 아시안/기타 테이블
const asianRows = [
  new TableRow({ children: [makeHeaderCell("식당명", 2800), makeHeaderCell("특징", 6200)] }),
  new TableRow({ children: [makeCell("땀땀", 2800, "F5F5F5"), makeCell("베트남 쌀국수 전문점 (구글 평점 4.1)", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("하이디라오", 2800), makeCell("유명 중국식 훠궈 체인 (구글 평점 4.2)", 6200)] }),
  new TableRow({ children: [makeCell("일일향 논현2호점", 2800, "F5F5F5"), makeCell("중식 전문점", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("장인닭갈비 강남점", 2800), makeCell("닭갈비 전문점", 6200)] }),
  new TableRow({ children: [makeCell("고베규카츠", 2800, "F5F5F5"), makeCell("일본식 규카츠 전문점", 6200, "F5F5F5")] }),
];

// 분식/간식 테이블
const snackRows = [
  new TableRow({ children: [makeHeaderCell("식당명", 2800), makeHeaderCell("특징", 6200)] }),
  new TableRow({ children: [makeCell("영차떡볶이", 2800, "F5F5F5"), makeCell("강남 인기 떡볶이 맛집", 6200, "F5F5F5")] }),
];

// 꿀팁 테이블
const tipRows = [
  new TableRow({ children: [makeHeaderCell("상황", 2800), makeHeaderCell("추천 맛집", 6200)] }),
  new TableRow({ children: [makeCell("점심 가성비", 2800, "FFF9E6"), makeCell("점심 특선 운영 식당 다수 - 저렴하게 즐길 수 있어요!", 6200, "FFF9E6")] }),
  new TableRow({ children: [makeCell("데이트", 2800, "F5F5F5"), makeCell("어거스트힐, 바비레드, 마녀주방", 6200, "F5F5F5")] }),
  new TableRow({ children: [makeCell("회식/단체", 2800, "FFF9E6"), makeCell("하이디라오, 강남 돼지상회", 6200, "FFF9E6")] }),
  new TableRow({ children: [makeCell("가성비", 2800, "F5F5F5"), makeCell("감탄성신, 미도인, 영차떡볶이", 6200, "F5F5F5")] }),
];

const doc = new Document({
  numbering: { config: [] },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
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
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
          children: [new TextRun({ text: "강남역 맛집 추천 2024", size: 18, color: "2E75B6", font: "Arial" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
          children: [
            new TextRun({ text: "Page ", size: 18, color: "888888", font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888", font: "Arial" }),
          ]
        })]
      })
    },
    children: [
      // 제목
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "강남역 맛집 추천 리스트", bold: true, size: 48, font: "Arial", color: "1F3864" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: "네이버·구글 플레이스 기반 엄선 맛집 모음", size: 22, font: "Arial", color: "888888" })]
      }),

      // 고기/삼겹살
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "고기 / 삼겹살", font: "Arial" })] }),
      makeTable(meatRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // 한식
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "한식", font: "Arial" })] }),
      makeTable(koreanRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // 양식/이탈리안
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "양식 / 이탈리안", font: "Arial" })] }),
      makeTable(westernRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // 아시안/기타
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "아시안 / 기타", font: "Arial" })] }),
      makeTable(asianRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // 분식/간식
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "분식 / 간식", font: "Arial" })] }),
      makeTable(snackRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),

      // 꿀팁
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "상황별 추천 꿀팁", font: "Arial" })] }),
      makeTable(tipRows, [2800, 6200]),
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("artifacts/강남역_맛집_추천.docx", buffer);
  console.log("저장 완료: artifacts/강남역_맛집_추천.docx");
});
