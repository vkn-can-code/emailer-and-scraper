'use client';

import { ProcessedChannel } from '@/types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportButtonsProps {
  channels: ProcessedChannel[];
  selectedDate?: Date | null;
}

export default function ExportButtons({ channels, selectedDate }: ExportButtonsProps) {
  const dateString = selectedDate 
    ? selectedDate.toLocaleDateString().replace(/\//g, '-')
    : new Date().toLocaleDateString().replace(/\//g, '-');

  const exportToWord = async () => {
    if (channels.length === 0) return;

    const doc = new Document({
      sections: [{
        properties: {},
        children: channels.flatMap(c => [
          new Paragraph({ text: c.name, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Tier: ${c.tier} | Score: ${c.leadScore}`, style: "italic" }),
          new Paragraph({ text: `Subscribers: ${c.subscriberCount} | Views: ${c.viewCount}` }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "SUBJECT: ", bold: true }),
              new TextRun({ text: c.emailSubject || "No Subject" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: c.emailBody || "No Body Content" }),
          new Paragraph({ text: "------------------------------------------------------------" }),
          new Paragraph({ text: "" }),
        ]),
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Outreach_Campaign_${dateString}.docx`);
  };

  const exportToPDF = () => {
    if (channels.length === 0) return;

    const doc = new jsPDF();
    doc.text(`Campaign Outreach Details`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Total Leads: ${channels.length} | Date: ${selectedDate ? selectedDate.toLocaleDateString() : new Date().toLocaleDateString()}`, 14, 30);

    const tableData = channels.map(c => [
      { 
        content: `${c.name}\n(${c.tier})\n${c.subscriberCount} Subs`, 
        styles: { fontStyle: 'bold' as const, halign: 'center' as const } 
      },
      `SUBJECT: ${c.emailSubject || "No Subject"}\n\n${c.emailBody || "No Content"}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Channel Information', 'Email Content']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 10, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        valign: 'top',
        overflow: 'linebreak'
      },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    doc.save(`Outreach_Emails_${dateString}.pdf`);
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={exportToPDF}
        disabled={channels.length === 0}
        className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-all"
      >
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        PDF
      </button>
      <button 
        onClick={exportToWord}
        disabled={channels.length === 0}
        className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-all"
      >
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        Word
      </button>
    </div>
  );
}

