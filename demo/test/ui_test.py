# ใช้: npm i html-to-image jspdf @fontsource/ibm-plex-sans-thai @fontsource/inter @fontsource/jetbrains-mono (ใน demo/test) แล้วรัน server.mjs ก่อน
# python ui_test.py IT_Project_Manager R19 pm
import asyncio, os, sys, json, pathlib
from playwright.async_api import async_playwright

BASE = os.environ.get('BASE', 'http://localhost:5678/webhook/is-demo')
HERE = pathlib.Path(__file__).resolve().parent
NM = str(HERE / 'node_modules')
OUT = HERE / 'shots'; OUT.mkdir(exist_ok=True)
SAMPLE = str(HERE.parent / 'samples') + '/resume_' + (sys.argv[1] if len(sys.argv) > 1 else 'IT_Project_Manager') + '.pdf'
ROLE = sys.argv[2] if len(sys.argv) > 2 else 'R19'
TAG = sys.argv[3] if len(sys.argv) > 3 else 'pm'

FONTS = {
  'IBM Plex Sans Thai': ('ibm-plex-sans-thai', ['thai', 'latin'], [400, 500, 600, 700]),
  'Inter': ('inter', ['latin'], [400, 500, 600, 700]),
  'JetBrains Mono': ('jetbrains-mono', ['latin'], [500]),
}
def LIB(u):
    return open(f'{NM}/html-to-image/dist/html-to-image.js','rb').read() if 'html-to-image' in u else open(f'{NM}/jspdf/dist/jspdf.umd.min.js','rb').read()

def font_css():
    css = []
    for fam, (pkg, subsets, ws) in FONTS.items():
        for s in subsets:
            for w in ws:
                css.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(https://fonts.gstatic.com/local/%s/%s-%s-%d-normal.woff2) format('woff2');}" % (fam, w, pkg, pkg, s, w))
    return '\n'.join(css)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, accept_downloads=True)
        errors = []
        async def r_css(route): await route.fulfill(status=200, headers={'content-type': 'text/css', 'access-control-allow-origin': '*'}, body=font_css())
        async def r_font(route):
            u = route.request.url.split('/local/')[1]; pkg, fn = u.split('/')
            fp = f'{NM}/@fontsource/{pkg}/files/{fn}'
            if os.path.exists(fp): await route.fulfill(status=200, headers={'content-type': 'font/woff2', 'access-control-allow-origin': '*'}, body=open(fp, 'rb').read())
            else: await route.fulfill(status=404, body='')
        async def r_lib(route): await route.fulfill(status=200, headers={'content-type': 'application/javascript', 'access-control-allow-origin': '*'}, body=LIB(route.request.url))
        await ctx.route('https://fonts.googleapis.com/**', r_css)
        await ctx.route('https://fonts.gstatic.com/local/**', r_font)
        await ctx.route('https://cdnjs.cloudflare.com/**', r_lib)
        page = await ctx.new_page()
        page.on('console', lambda m: errors.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        await page.goto(BASE)
        await page.wait_for_timeout(1200)
        await page.evaluate("document.documentElement.setAttribute('data-theme','light')")
        await page.wait_for_timeout(400)
        await page.screenshot(path=str(OUT / f'01_form_light.png'), full_page=True)
        await page.click('#themeBtn'); await page.wait_for_timeout(700)
        await page.screenshot(path=str(OUT / f'02_form_dark.png'), full_page=False)
        await page.click(f'.role[data-id="{ROLE}"]')
        await page.click('#segMonths button[data-v="12"]')
        await page.fill('#hrsNum', '10')
        await page.set_input_files('#file', SAMPLE)
        await page.click('.consent')
        await page.wait_for_timeout(600)
        await page.screenshot(path=str(OUT / f'03_form_filled_dark.png'), full_page=True)
        await page.click('#submitBtn')
        await page.wait_for_timeout(1300)
        await page.screenshot(path=str(OUT / f'04_processing_dark.png'))
        await page.wait_for_selector('#vReport.on', timeout=60000)
        await page.wait_for_timeout(2600)
        await page.screenshot(path=str(OUT / f'05a_report_{TAG}_dark_top.png'))
        await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        await page.wait_for_timeout(1200)
        await page.screenshot(path=str(OUT / f'05_report_{TAG}_dark.png'), full_page=True)
        await page.click('#themeBtn'); await page.wait_for_timeout(900)
        await page.screenshot(path=str(OUT / f'06_report_{TAG}_light.png'), full_page=True)
        await page.screenshot(path=str(OUT / f'06b_report_{TAG}_light_top.png'))
        # expand a requirement + hover tooltip
        await page.click('.req-h >> nth=0'); await page.wait_for_timeout(500)
        # PDF download
        async with page.expect_download(timeout=90000) as dl:
            await page.click('#btnPdf')
        d = await dl.value
        (HERE / 'out').mkdir(exist_ok=True); pdf_path = str(HERE / 'out' / d.suggested_filename)
        await d.save_as(pdf_path)
        print('PDF', pdf_path, os.path.getsize(pdf_path))
        await page.wait_for_timeout(800)
        # Drive upload
        await page.click('#btnDrive')
        await page.wait_for_selector('.toast.ok >> text=Google Drive' if not os.environ.get('EXPECT_DRIVE_ERROR') else '.toast.err', timeout=90000)
        print('DRIVE TOAST:', (await page.inner_text('#toasts'))[:200])
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / f'07_drive_toast.png'))
        # mobile
        m = await ctx.new_page(); await m.set_viewport_size({'width': 390, 'height': 844})
        await m.goto(BASE); await m.wait_for_timeout(1000)
        await m.screenshot(path=str(OUT / f'08_mobile_form.png'), full_page=True)
        print('ERRORS', json.dumps(errors, ensure_ascii=False, indent=1))
        await b.close()

asyncio.run(main())
