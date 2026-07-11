import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export class JsonFileStorage {
  constructor(filePath) {
    this.filePath = resolve(filePath);
  }

  read() {
    if (!existsSync(this.filePath)) return null;
    try {
      return JSON.parse(readFileSync(this.filePath, "utf-8"));
    } catch {
      return null;
    }
  }

  write(data) {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = this.filePath + ".tmp";
    try {
      writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
      renameSync(tmp, this.filePath);
    } catch {
      try { unlinkSync(tmp); } catch {}
      throw new Error("No se pudo escribir el archivo de datos. Verifique espacio en disco y permisos.");
    }
  }
}
