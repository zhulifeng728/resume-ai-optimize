import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class ParserService {
  async parse(file: Express.Multer.File): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const ext = extname(file.originalname).toLowerCase();

    switch (ext) {
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
        throw new BadRequestException(`Unsupported format: ${ext}`);
    }
  }

  private async parsePdf(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return {
      text: result.text,
      metadata: { pages: result.numpages, info: result.info },
    };
  }

  private async parseDocx(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const mammoth = require('mammoth');
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      metadata: { messages: result.messages },
    };
  }

  private async parseImage(filePath: string): Promise<{ text: string; metadata: Record<string, unknown> }> {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(filePath, 'eng+chi_sim');
    return {
      text: data.text,
      metadata: { confidence: data.confidence },
    };
  }
}
