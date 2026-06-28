/**
 * =============================================================================
 * file.ts — FileHelper (temp files, byte-accurate I/O, magic-byte detection)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   File tests must treat data as BYTES, not text. This helper centralizes:
 *     - writing/reading files as Buffers (lossless),
 *     - a scratch dir under test-results/ (git-ignored, cleaned by `npm run clean`),
 *     - detectType(): identify a file by its MAGIC BYTES (the only reliable way —
 *       file extensions and Content-Type headers can lie).
 *
 * WHY MAGIC BYTES:
 *   Every binary format has a signature: PNG = 89 50 4E 47, PDF = %PDF,
 *   ZIP = PK.., GZIP = 1F 8B. Checking these proves you received REAL content of
 *   the expected type, not an HTML error page mislabeled as image/png.
 * =============================================================================
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

export type FileType = 'png' | 'jpeg' | 'pdf' | 'zip' | 'gzip' | 'unknown';

/** Scratch directory for generated test files (git-ignored). */
const SCRATCH_DIR = path.resolve(process.cwd(), 'test-results', 'files');

export class FileHelper {
  /** Ensure and return the scratch directory path. */
  public static tempDir(): string {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    return SCRATCH_DIR;
  }

  /** Write content (text or bytes) to a file in the scratch dir; return its path. */
  public static write(name: string, content: string | Buffer): string {
    const filePath = path.join(FileHelper.tempDir(), name);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /** Read a file as raw bytes (Buffer) — lossless for binary content. */
  public static read(filePath: string): Buffer {
    return fs.readFileSync(filePath);
  }

  /** Read a file as UTF-8 text. */
  public static readText(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /** File size in bytes. */
  public static size(filePath: string): number {
    return fs.statSync(filePath).size;
  }

  /** Whether a path exists. */
  public static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /** Delete a file if present. */
  public static remove(filePath: string): void {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  /** Identify a buffer's type by its leading magic bytes. */
  public static detectType(buffer: Buffer): FileType {
    if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      return 'png'; // 89 50 4E 47
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'jpeg'; // FF D8 FF
    }
    if (buffer.subarray(0, 4).toString('latin1') === '%PDF') {
      return 'pdf';
    }
    if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
      return 'zip'; // 'PK' (50 4B ..)
    }
    if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
      return 'gzip'; // 1F 8B
    }
    return 'unknown';
  }

  /** A minimal byte sequence with a valid PDF header/trailer (for type tests). */
  public static minimalPdf(): Buffer {
    return Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
      'latin1',
    );
  }

  /** A REAL, valid empty ZIP (End-Of-Central-Directory record only). */
  public static emptyZip(): Buffer {
    // PK\x05\x06 + 18 zero bytes = a structurally valid empty archive.
    return Buffer.from([
      0x50,
      0x4b,
      0x05,
      0x06,
      ...new Array<number>(18).fill(0),
    ]);
  }

  /** Gzip-compress text into a real .gz buffer. */
  public static gzip(text: string): Buffer {
    return zlib.gzipSync(Buffer.from(text, 'utf-8'));
  }
}
