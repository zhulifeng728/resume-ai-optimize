import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import TurndownService from 'turndown';

@Injectable()
export class ParserService {
  private turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

  async parse(file: Express.Multer.File): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const ext = extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.md':
        return this.parseMd(file.path);
      case '.pdf':
        return this.parsePdf(file.path);
      case '.docx':
      case '.doc':
        return this.parseDocx(file.path);
      case '.png':
      case '.jpg':
      case '.jpeg':
        return this.parseImage(file.path);
      default:
        throw new BadRequestException(`不支持的文件格式: ${ext}`);
    }
  }

  private parseMd(filePath: string): { text: string; metadata: Record<string, unknown> } {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { text, metadata: { format: 'markdown' } };
  }

  private async parsePdf(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    const markdown = this.plainTextToMarkdown(result.text);
    return {
      text: markdown,
      metadata: { pages: result.numpages, info: result.info, format: 'pdf' },
    };
  }

  private async parseDocx(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const mammoth = require('mammoth');
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    const markdown = this.turndown.turndown(result.value);
    return {
      text: markdown,
      metadata: { messages: result.messages, format: 'docx' },
    };
  }

  private async parseImage(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(filePath, 'eng+chi_sim');
    const markdown = this.plainTextToMarkdown(data.text);
    return {
      text: markdown,
      metadata: { confidence: data.confidence, format: 'image' },
    };
  }

  // PDF/OCR 纯文本 → 基础 Markdown：短行变标题，符号开头变列表，清理多余空行
  private plainTextToMarkdown(text: string): string {
    const lines = text.split('\n').map((l) => l.trimEnd());
    const result: string[] = [];
    let prevBlank = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] ?? '';
      const isBlank = line.trim() === '';

      if (isBlank) {
        if (!prevBlank) result.push('');
        prevBlank = true;
        continue;
      }

      const trimmed = line.trim();

      // 短行 + 前后空行 → 二级标题
      if (prevBlank && trimmed.length <= 40 && (nextLine.trim() === '' || i === lines.length - 1)) {
        result.push(`## ${trimmed}`);
        prevBlank = false;
        continue;
      }

      // 以 ·、•、-、* 开头 → 列表项
      if (/^[·•\-\*]\s+/.test(trimmed)) {
        result.push(`- ${trimmed.replace(/^[·•\-\*]\s+/, '')}`);
        prevBlank = false;
        continue;
      }

      result.push(trimmed);
      prevBlank = false;
    }

    return result.join('\n').trim();
  }
}
