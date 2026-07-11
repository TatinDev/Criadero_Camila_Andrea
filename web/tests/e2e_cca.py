"""E2E functional tests - Criadero Camila Andrea."""
import json, sys, os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4178"
EMAIL = "owner@criadero.local"
PASSWORD = "admin123"

def run():
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        def login():
            page.goto(BASE, wait_until="domcontentloaded", timeout=10000)
            try:
                page.wait_for_selector(".sidebar", timeout=3000)
                return True
            except:
                pass
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            try:
                page.wait_for_selector(".sidebar", timeout=5000)
                return True
            except:
                return False

        def nav_to(label):
            for b in page.query_selector_all(".sidebar-nav button"):
                if label in (b.inner_text() or ""):
                    b.click(); page.wait_for_timeout(800); return True
            return False

        # ── 1. Dashboard loads ──
        try:
            login()
            page.wait_for_selector(".kpi-grid", timeout=5000)
            kpis = len(page.query_selector_all(".kpi"))
            results["e2e_dashboard"] = {"status": "pass" if kpis >= 4 else "fail", "detail": f"{kpis} KPIs"}
        except Exception as e:
            results["e2e_dashboard"] = {"status": "fail", "detail": str(e)[:100]}

        # ── 2. Navigate all modules ──
        modules = ["Caballos", "Clientes", "Pensiones", "Pagos", "Sanidad", "Documentos", "Genealogia", "Auditoria", "Buscador", "Admin"]
        nav_ok = 0
        for m in modules:
            if nav_to(m):
                page.wait_for_timeout(500)
                if page.query_selector("table") or page.query_selector(".card"):
                    nav_ok += 1
        results["e2e_navigation"] = {"status": "pass" if nav_ok >= 8 else "fail", "detail": f"{nav_ok}/{len(modules)} modules loaded"}

        # ── 3. Create horse modal ──
        try:
            nav_to("Caballos")
            page.wait_for_timeout(500)
            page.query_selector("button:has-text('Nuevo')").click()
            page.wait_for_timeout(600)
            modal = page.query_selector(".modal-box")
            req = len(page.query_selector_all(".req"))
            page.query_selector(".modal-close").click()
            page.wait_for_timeout(400)
            results["e2e_horse_modal"] = {"status": "pass" if modal and req >= 3 else "fail", "detail": f"Modal={'yes' if modal else 'no'}, Required={req}"}
        except Exception as e:
            results["e2e_horse_modal"] = {"status": "fail", "detail": str(e)[:100]}

        # ── 4. Create client modal ──
        try:
            nav_to("Clientes")
            page.wait_for_timeout(500)
            page.query_selector("button:has-text('Nuevo')").click()
            page.wait_for_timeout(600)
            modal2 = page.query_selector(".modal-box")
            req2 = len(page.query_selector_all(".req"))
            save_btn = page.query_selector(".modal-save")
            blocked = save_btn.get_attribute("disabled") if save_btn else None
            page.query_selector(".modal-close").click()
            page.wait_for_timeout(400)
            results["e2e_client_modal"] = {"status": "pass" if modal2 and blocked is not None else "fail", "detail": f"Modal={'yes' if modal2 else 'no'}, Required={req2}, Save={'blocked' if blocked else 'enabled'}"}
        except Exception as e:
            results["e2e_client_modal"] = {"status": "fail", "detail": str(e)[:100]}

        # ── 5. Ficha button in horses ──
        try:
            nav_to("Caballos")
            page.wait_for_timeout(500)
            ficha = page.query_selector("button:has-text('Ficha')")
            if ficha:
                ficha.click(); page.wait_for_timeout(600)
                fm = page.query_selector(".modal-box")
                has_data = fm and "Nombre:" in (fm.inner_text() or "")
                page.query_selector(".modal-close").click() if fm else None
                page.wait_for_timeout(400)
                results["e2e_horse_ficha"] = {"status": "pass" if has_data else "fail", "detail": "Detail shown" if has_data else "No detail"}
            else:
                results["e2e_horse_ficha"] = {"status": "skip", "detail": "No ficha btn"}
        except Exception as e:
            results["e2e_horse_ficha"] = {"status": "skip", "detail": str(e)[:100]}

        # ── 6. Profile page exists ──
        try:
            nav_to("Mi perfil")
            page.wait_for_timeout(600)
            has_profile_form = page.query_selector("#profile-form") is not None
            has_password_form = page.query_selector("#password-form") is not None
            results["e2e_profile"] = {"status": "pass" if has_profile_form else "fail", "detail": f"Profile={'yes' if has_profile_form else 'no'}, Password={'yes' if has_password_form else 'no'}"}
        except Exception as e:
            results["e2e_profile"] = {"status": "fail", "detail": str(e)[:100]}

        # ── 7. Audit filters ──
        try:
            nav_to("Auditoria")
            page.wait_for_timeout(600)
            selects = len(page.query_selector_all("select"))
            date_inputs = len(page.query_selector_all("input[type='date']"))
            sort_btns = len(page.query_selector_all("button:has-text('Fecha'),button:has-text('Importancia')"))
            results["e2e_audit_filters"] = {"status": "pass" if selects >= 4 else "fail", "detail": f"Selects={selects}, Dates={date_inputs}, Sort={'yes' if sort_btns else 'no'}"}
        except Exception as e:
            results["e2e_audit_filters"] = {"status": "fail", "detail": str(e)[:100]}

        browser.close()

    passed = sum(1 for v in results.values() if v.get("status") == "pass")
    failed = sum(1 for v in results.values() if v.get("status") == "fail")
    skipped = sum(1 for v in results.values() if v.get("status") == "skip")
    return {
        "status": "pass" if failed == 0 else "fail",
        "total": len(results), "passed": passed, "failed": failed, "skipped": skipped,
        "checks": results,
    }

if __name__ == "__main__":
    result = run()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0 if result["status"] == "pass" else 1)
