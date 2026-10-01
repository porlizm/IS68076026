# -*- coding: utf-8 -*-
"""
export_pdf.py — แปลงเล่ม .docx เป็น PDF ด้วย LibreOffice (headless) โดยอัปเดตสารบัญ สารบัญตาราง และสารบัญรูปก่อนส่งออก

  python scripts/export_pdf.py                       -> build/IS_68076026_Final_<DDMMMYY>.pdf จาก docx ล่าสุดใน build/build_info.json
  python scripts/export_pdf.py build/<ไฟล์>.docx      -> PDF ชื่อเดียวกัน

ต้องมี LibreOffice และโมดูล uno (python3-uno) · ฟอนต์ TH Sarabun New ต้องติดตั้งในเครื่อง (หรือใช้ฟอนต์ที่ฝังใน docx)
ไฟล์ docx ไม่ถูกแก้ · PDF ใช้แท็ก (tagged PDF) และมีที่คั่นหน้าตามหัวข้อ
"""
import json, os, re, subprocess, sys, tempfile, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def main():
    import uno
    from com.sun.star.beans import PropertyValue

    def pv(n, v):
        p = PropertyValue(); p.Name = n; p.Value = v; return p

    src = sys.argv[1] if len(sys.argv) > 1 else json.load(open(os.path.join(ROOT, "build", "build_info.json"), encoding="utf-8"))["file"]
    src = os.path.abspath(os.path.join(ROOT, src) if not os.path.isabs(src) else src)
    out = os.path.splitext(src)[0] + ".pdf"
    prof = tempfile.mkdtemp(prefix="lo_profile_")
    port = 2002 + os.getpid() % 500
    proc = subprocess.Popen(["soffice", "--headless", "--invisible", "--nologo", "--norestore", f"-env:UserInstallation=file://{prof}",
                             f"--accept=socket,host=127.0.0.1,port={port};urp;"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
        for _ in range(60):
            try:
                ctx = resolver.resolve(f"uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext"); break
            except Exception:
                time.sleep(1)
        else:
            raise SystemExit("เชื่อม LibreOffice ไม่ได้")
        desk = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        doc = desk.loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (pv("Hidden", True),))
        for _ in range(2):  # รอบสองเพื่อให้เลขหน้าในสารบัญตรงหลังสารบัญยาวขึ้น
            idx = doc.getDocumentIndexes()
            for i in range(idx.getCount()): idx.getByIndex(i).update()
            doc.getTextFields().refresh()
        fd = uno.Any("[]com.sun.star.beans.PropertyValue", tuple([pv("UseTaggedPDF", True), pv("ExportBookmarks", True),
                                                                  pv("EmbedStandardFonts", True), pv("SelectPdfVersion", 0)]))
        doc.storeToURL(uno.systemPathToFileUrl(out), (pv("FilterName", "writer_pdf_Export"), pv("FilterData", fd)))
        n = doc.getDocumentIndexes().getCount()
        doc.close(True)
        pages = None
        try:
            info = subprocess.run(["pdfinfo", out], capture_output=True, text=True).stdout
            pages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
            bi = os.path.join(ROOT, "build", "build_info.json")
            if os.path.exists(bi):
                d = json.load(open(bi, encoding="utf-8")); d.update(pdf=os.path.relpath(out, ROOT), pdf_pages=pages)
                json.dump(d, open(bi, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        except Exception:
            pass
        print(f"เขียน {os.path.relpath(out, ROOT)} · {pages} หน้า · อัปเดตดัชนี {n} รายการ")
    finally:
        proc.terminate()
        try: proc.wait(10)
        except Exception: proc.kill()


if __name__ == "__main__":
    main()
