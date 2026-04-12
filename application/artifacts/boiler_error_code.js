const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

function makeHeaderCell(text, fillColor) {
  return new TableCell({
    borders: headerBorders,
    width: { size: 4680, type: WidthType.DXA },
    shading: { fill: fillColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "맑은 고딕" })]
    })]
  });
}

function makeCell(text, fillColor, bold = false, align = AlignmentType.LEFT) {
  return new TableCell({
    borders,
    width: { size: 4680, type: WidthType.DXA },
    shading: { fill: fillColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, size: 20, font: "맑은 고딕" })]
    })]
  });
}

function makeTable(headerColor, rowColor1, rowColor2, rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 7020],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: headerBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: headerColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "에러 코드", bold: true, color: "FFFFFF", size: 22, font: "맑은 고딕" })]
            })]
          }),
          new TableCell({
            borders: headerBorders,
            width: { size: 7020, type: WidthType.DXA },
            shading: { fill: headerColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "내용", bold: true, color: "FFFFFF", size: 22, font: "맑은 고딕" })]
            })]
          }),
        ]
      }),
      ...rows.map(([code, desc], i) => new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? rowColor1 : rowColor2, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: code, bold: true, size: 20, font: "맑은 고딕" })]
            })]
          }),
          new TableCell({
            borders,
            width: { size: 7020, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? rowColor1 : rowColor2, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: desc, size: 20, font: "맑은 고딕" })]
            })]
          }),
        ]
      }))
    ]
  });
}

function makeCommonTable() {
  const headerColor = "4A4A4A";
  const rows = [
    ["점화 불량", "가스 밸브 확인, 점화봉 오염 여부 점검"],
    ["과열 차단", "난방수 순환 불량, 필터 막힘 확인"],
    ["압력 부족", "난방수 보충 필요 (압력계 1~1.5bar 유지)"],
    ["팬 모터 이상", "배기구 막힘, 모터 고장 여부 점검"],
    ["온도 센서 이상", "센서 불량 또는 단선 확인"],
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: headerBorders,
            width: { size: 3120, type: WidthType.DXA },
            shading: { fill: headerColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "에러 원인", bold: true, color: "FFFFFF", size: 22, font: "맑은 고딕" })]
            })]
          }),
          new TableCell({
            borders: headerBorders,
            width: { size: 6240, type: WidthType.DXA },
            shading: { fill: headerColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "조치 방법", bold: true, color: "FFFFFF", size: 22, font: "맑은 고딕" })]
            })]
          }),
        ]
      }),
      ...rows.map(([cause, action], i) => new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 3120, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? "F5F5F5" : "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: cause, bold: true, size: 20, font: "맑은 고딕" })]
            })]
          }),
          new TableCell({
            borders,
            width: { size: 6240, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? "F5F5F5" : "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: action, size: 20, font: "맑은 고딕" })]
            })]
          }),
        ]
      }))
    ]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "맑은 고딕", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "맑은 고딕", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "맑은 고딕", color: "2E75B6" },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 }
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
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
          children: [new TextRun({ text: "보일러 에러 코드 안내서", bold: true, size: 22, font: "맑은 고딕", color: "2E75B6" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
          children: [
            new TextRun({ text: "Page ", size: 18, font: "맑은 고딕", color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "맑은 고딕", color: "888888" }),
          ]
        })]
      })
    },
    children: [
      // 제목
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: "🔥 보일러 에러 코드 안내서", bold: true, size: 48, font: "맑은 고딕", color: "1F3864" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2E75B6", space: 4 } },
        children: [new TextRun({ text: "주요 보일러 브랜드별 에러 코드 및 조치 방법", size: 24, font: "맑은 고딕", color: "555555" })]
      }),

      // 경동나비엔
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "1. 경동나비엔 (Navien)", bold: true, size: 32, font: "맑은 고딕", color: "1565C0" })]
      }),
      makeTable("1565C0", "E3F2FD", "FFFFFF", [
        ["E003", "점화 불량"],
        ["E004", "과열 감지"],
        ["E012", "배기 온도 센서 이상"],
        ["E030", "팬 모터 이상"],
        ["E047", "급수 압력 부족"],
      ]),

      new Paragraph({ spacing: { before: 300, after: 0 }, children: [new TextRun("")] }),

      // 린나이
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "2. 린나이 (Rinnai)", bold: true, size: 32, font: "맑은 고딕", color: "B71C1C" })]
      }),
      makeTable("B71C1C", "FFEBEE", "FFFFFF", [
        ["12", "점화 불량"],
        ["14", "과열 차단"],
        ["16", "팬 모터 이상"],
        ["32", "온도 센서 이상"],
        ["61", "배기 이상"],
      ]),

      new Paragraph({ spacing: { before: 300, after: 0 }, children: [new TextRun("")] }),

      // 귀뚜라미
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "3. 귀뚜라미 (Kiturami)", bold: true, size: 32, font: "맑은 고딕", color: "1B5E20" })]
      }),
      makeTable("1B5E20", "E8F5E9", "FFFFFF", [
        ["E01", "점화 불량"],
        ["E02", "과열 차단"],
        ["E03", "온도 센서 이상"],
        ["E07", "팬 모터 이상"],
        ["E08", "급수 압력 부족"],
      ]),

      new Paragraph({ spacing: { before: 300, after: 0 }, children: [new TextRun("")] }),

      // 공통 에러 원인
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "4. 공통 에러 원인 및 조치 방법", bold: true, size: 32, font: "맑은 고딕", color: "4A148C" })]
      }),
      makeCommonTable(),

      new Paragraph({ spacing: { before: 300, after: 0 }, children: [new TextRun("")] }),

      // 안내 문구
      new Paragraph({
        spacing: { before: 400, after: 100 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "FF8F00", space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "FF8F00", space: 4 },
          left: { style: BorderStyle.SINGLE, size: 12, color: "FF8F00", space: 4 },
          right: { style: BorderStyle.SINGLE, size: 4, color: "FF8F00", space: 4 },
        },
        children: [new TextRun({ text: "⚠️  주의사항", bold: true, size: 24, font: "맑은 고딕", color: "E65100" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "• 에러 코드는 제조사 및 모델에 따라 다를 수 있습니다.", size: 20, font: "맑은 고딕" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "• 에러가 반복될 경우 반드시 전문 기사에게 점검을 의뢰하세요.", size: 20, font: "맑은 고딕" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "• 난방수 압력은 1~1.5bar를 유지하는 것이 좋습니다.", size: 20, font: "맑은 고딕" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 200 },
        children: [new TextRun({ text: "• 가스 관련 문제는 임의로 수리하지 말고 전문가에게 문의하세요.", size: 20, font: "맑은 고딕" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/ksdyb/Documents/src/power-agent/application/artifacts/보일러_에러코드_안내서.docx", buffer);
  console.log("✅ 파일 생성 완료: /Users/ksdyb/Documents/src/power-agent/application/artifacts/보일러_에러코드_안내서.docx");
});
