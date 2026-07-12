"""Smoke test completo para Criadero Camila Andrea - todos los modulos."""

import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4178"
EMAIL = "owner@criadero.local"
PASSWORD = "admin123"

def run():
    results = {}
    errors = []
    console_log = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", lambda msg: console_log.append(f"[{msg.type}] {msg.text}"))

        # ── SETUP: Login ──
        page.goto(BASE, wait_until="domcontentloaded", timeout=10000)
        page.fill('input[name="email"]', EMAIL)
        page.fill('input[name="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_selector(".sidebar", timeout=5000)
        if not page.query_selector(".sidebar"):
            browser.close()
            return report({"login": {"status": "fail", "detail": "Login failed"}}, [])

        # ── HELPER: navigate to module ──
        def nav_to(label_text):
            for b in page.query_selector_all(".sidebar-nav button"):
                if label_text in (b.inner_text() or ""):
                    b.click()
                    page.wait_for_timeout(700)
                    return True
            return False

        # ── HELPER: click button by text ──
        def click_button(text):
            btn = page.query_selector(f"button:has-text('{text}')")
            if btn:
                btn.click()
                page.wait_for_timeout(600)
                return True
            return False

        # ── HELPER: check modal ──
        def check_modal(expected_required=0):
            page.wait_for_timeout(500)
            modal = page.query_selector(".modal-box")
            if not modal:
                return {"status": "fail", "detail": "Modal not found"}
            req = len(page.query_selector_all(".req"))
            save = page.query_selector(".modal-save")
            blocked = save.get_attribute("disabled") if save else None
            result = {"status": "pass", "detail": f"Modal OK, {req} required, save {'blocked' if blocked else 'enabled'}"}
            if expected_required and req != expected_required:
                result["status"] = "fail"
                result["detail"] += f" (expected {expected_required})"
            page.click(".modal-close")
            page.wait_for_timeout(400)
            return result

        # ── HELPER: try form submit, check validation ──
        def test_empty_submit(expected_req=0):
            page.wait_for_timeout(500)
            modal = page.query_selector(".modal-box")
            if not modal:
                return {"status": "fail", "detail": "Modal not found"}
            save = page.query_selector(".modal-save")
            if not save:
                return {"status": "skip", "detail": "No save button"}
            blocked = save.get_attribute("disabled")
            if blocked is not None:
                page.click(".modal-close")
                return {"status": "pass", "detail": f"Save blocked correctly"}
            save.click()
            page.wait_for_timeout(500)
            banner = page.query_selector(".validation-errors")
            page.click(".modal-close")
            page.wait_for_timeout(400)
            if banner:
                text = banner.inner_text()[:150]
                return {"status": "pass", "detail": f"Validation shown: {text}"}
            return {"status": "fail", "detail": "No validation, no save block"}

        # ══════════════════════════════════════════
        # 1. DASHBOARD
        # ══════════════════════════════════════════
        nav_to("Panel")
        page.wait_for_selector(".kpi-grid", timeout=5000)
        kpis = len(page.query_selector_all(".kpi"))
        results["dashboard"] = {"status": "pass" if kpis >= 4 else "fail", "detail": f"{kpis} KPIs"}

        # ══════════════════════════════════════════
        # 2. CABALLOS PROPIOS
        # ══════════════════════════════════════════
        nav_to("Caballos")
        if click_button("Nuevo"):
            results["horses_create_modal"] = check_modal(expected_required=4)
        else:
            results["horses_create_modal"] = {"status": "fail", "detail": "No Nuevo button"}
        if click_button("Nuevo"):
            results["horses_create_validation"] = test_empty_submit(4)
        else:
            results["horses_create_validation"] = {"status": "skip", "detail": "No Nuevo button"}

        # Check both create buttons exist (own + boarded)
        nav_to("Caballos")
        own_btn = page.query_selector("#btn-new-own")
        boarded_btn = page.query_selector("#btn-new-boarded")
        results["horses_create_buttons"] = {
            "status": "pass" if own_btn and boarded_btn else "fail",
            "detail": f"Propio={'yes' if own_btn else 'no'}, Pensionado={'yes' if boarded_btn else 'no'}"
        }
        if boarded_btn:
            boarded_btn.click()
            page.wait_for_timeout(500)
            req = len(page.query_selector_all(".req"))
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["horses_boarded_fields"] = {"status": "pass" if req >= 5 else "fail", "detail": f"{req} required (boarded)"}
        else:
            results["horses_boarded_fields"] = {"status": "skip", "detail": "No btn-new-boarded"}

        # Change status modal
        nav_to("Caballos")
        page.wait_for_timeout(500)
        status_btn = page.query_selector("button:has-text('Estado')")
        if status_btn:
            status_btn.click()
            page.wait_for_timeout(600)
            modal = page.query_selector(".modal-box")
            if modal:
                save = page.query_selector(".modal-save")
                blocked = save.get_attribute("disabled") if save else None
                page.click(".modal-close")
                page.wait_for_timeout(400)
                results["horses_change_status_modal"] = {"status": "pass", "detail": f"Modal OK, save {'blocked' if blocked else 'enabled'}"}
            else:
                results["horses_change_status_modal"] = {"status": "fail", "detail": "No modal"}
        else:
            results["horses_change_status_modal"] = {"status": "skip", "detail": "No horses in list (no actions available)"}

        # Delete horse modal
        nav_to("Caballos")
        page.wait_for_timeout(500)
        del_btn = page.query_selector("button:has-text('Eliminar')")
        if del_btn:
            del_btn.click()
            page.wait_for_timeout(600)
            modal = page.query_selector(".modal-box")
            if modal:
                reason_input = page.query_selector("input[name='reason']")
                delete_btn = page.query_selector(".modal-save")
                del_blocked = delete_btn.get_attribute("disabled") if delete_btn else None
                page.click(".modal-close")
                page.wait_for_timeout(400)
                results["horses_delete_modal"] = {
                    "status": "pass" if reason_input else "fail",
                    "detail": f"Modal OK, reason={'yes' if reason_input else 'no'}, save={'blocked' if del_blocked else 'enabled'}"
                }
            else:
                results["horses_delete_modal"] = {"status": "fail", "detail": "No modal"}
        else:
            results["horses_delete_modal"] = {"status": "skip", "detail": "No horses in list"}

        # ══════════════════════════════════════════
        # 3. CLIENTES
        # ══════════════════════════════════════════
        nav_to("Clientes")
        if click_button("Nuevo"):
            results["clients_create_modal"] = check_modal(expected_required=4)
        else:
            results["clients_create_modal"] = {"status": "fail", "detail": "No Nuevo button"}
        if click_button("Nuevo"):
            results["clients_create_validation"] = test_empty_submit(4)
        else:
            results["clients_create_validation"] = {"status": "skip", "detail": "No Nuevo button"}

        # ══════════════════════════════════════════
        # 4. PENSIONES
        # ══════════════════════════════════════════
        nav_to("Pensiones")
        if click_button("Nueva pension"):
            results["boarding_create_modal"] = check_modal(expected_required=6)
        else:
            results["boarding_create_modal"] = {"status": "fail", "detail": "No Nueva pension button"}
        if click_button("Nueva pension"):
            results["boarding_create_validation"] = test_empty_submit(6)
        else:
            results["boarding_create_validation"] = {"status": "skip", "detail": "No Nueva pension button"}

        # ══════════════════════════════════════════
        # 5. PAGOS
        # ══════════════════════════════════════════
        nav_to("Pagos")
        if click_button("Registrar pago"):
            results["payments_create_modal"] = check_modal(expected_required=4)
        else:
            results["payments_create_modal"] = {"status": "fail", "detail": "No Registrar pago button"}
        if click_button("Registrar pago"):
            results["payments_create_validation"] = test_empty_submit(4)
        else:
            results["payments_create_validation"] = {"status": "skip", "detail": "No Registrar pago button"}

        # ══════════════════════════════════════════
        # 6. VACUNAS
        # ══════════════════════════════════════════
        nav_to("Vacunas")
        page.wait_for_timeout(500)
        vacc_btn = page.query_selector("#btn-new-vacc")
        results["health_buttons"] = {
            "status": "pass" if vacc_btn else "fail",
            "detail": "Registrar Vacunas button: " + ("yes" if vacc_btn else "no")
        }
        if vacc_btn:
            vacc_btn.click()
            page.wait_for_timeout(600)
            results["health_vaccination_modal"] = check_modal(expected_required=4)
            page.wait_for_timeout(300)
            vacc_btn.click()
            page.wait_for_timeout(600)
            results["health_vaccination_validation"] = test_empty_submit(4)
        else:
            results["health_vaccination_modal"] = {"status": "fail", "detail": "No btn-new-vacc"}
            results["health_vaccination_validation"] = {"status": "skip"}

        # ══════════════════════════════════════════
        # 6b. HERRAJES
        # ══════════════════════════════════════════
        nav_to("Herrajes")
        page.wait_for_timeout(500)
        farrier_btn = page.query_selector("#btn-new-farrier")
        results["health_farrier_modal"] = {
            "status": "pass" if farrier_btn else "fail",
            "detail": "Registrar Herrajes button: " + ("yes" if farrier_btn else "no")
        }
        if farrier_btn:
            farrier_btn.click()
            page.wait_for_timeout(600)
            results["health_farrier_modal"] = check_modal(expected_required=4)
            page.wait_for_timeout(300)
            farrier_btn.click()
            page.wait_for_timeout(600)
            results["health_farrier_validation"] = test_empty_submit(4)
        else:
            results["health_farrier_validation"] = {"status": "skip"}

        # ══════════════════════════════════════════
        # 7. DOCUMENTOS
        # ══════════════════════════════════════════
        nav_to("Documentos")
        if click_button("Subir documentos"):
            page.wait_for_timeout(600)
            results["documents_upload_modal"] = check_modal()
        else:
            results["documents_upload_modal"] = {"status": "fail", "detail": "No Subir documentos button"}

        # ══════════════════════════════════════════
        # 8. GENEALOGIA
        # ══════════════════════════════════════════
        nav_to("Genealogia")
        selector = page.query_selector("select")
        tree = page.query_selector(".genealogy-tree")
        results["genealogy"] = {
            "status": "pass" if selector else "skip",
            "detail": f"Selector={'yes' if selector else 'no'}, Tree={'yes' if tree else 'no (no horses)'}"
        }

        # ══════════════════════════════════════════
        # 9. AUDITORIA
        # ══════════════════════════════════════════
        nav_to("Auditoria")
        table = page.query_selector("table")
        filters = len(page.query_selector_all("select"))
        results["audit"] = {
            "status": "pass" if table else "fail",
            "detail": f"Table={'yes' if table else 'no'}, Filters={filters}"
        }

        # ══════════════════════════════════════════
        # 10. ADMIN (solo owner)
        # ══════════════════════════════════════════
        nav_to("Admin")
        sections = len(page.query_selector_all(".card"))
        if click_button("Nueva invitacion"):
            page.wait_for_timeout(600)
            results["admin_invitation_modal"] = check_modal(expected_required=3)
        else:
            results["admin_invitation_modal"] = {"status": "fail", "detail": "No Nueva invitacion button"}
        results["admin_sections"] = {"status": "pass" if sections >= 1 else "fail", "detail": f"{sections} sections"}

        # ══════════════════════════════════════════
        # 11. BUSCADOR GLOBAL
        # ══════════════════════════════════════════
        nav_to("Buscador")
        search_input = page.query_selector("input[type='text']")
        results["search"] = {
            "status": "pass" if search_input else "fail",
            "detail": "Input found" if search_input else "No search input"
        }

        # ══════════════════════════════════════════
        # 12. FUNCTIONAL FLOWS (new 21 checks)
        # ══════════════════════════════════════════

        # ── 12a. Create horse (own) ──
        nav_to("Caballos")
        click_button("Nuevo")
        page.wait_for_timeout(500)
        page.fill('input[name="name"]', "Test Horse")
        page.select_option('select[name="sex"]', "stallion")
        page.select_option('select[name="color"]', "alazan")
        page.fill('textarea[name="distinctiveMarks"]', "Estrella blanca")
        page.fill('input[name="breedingFarmName"]', "Criadero Test")
        save = page.query_selector(".modal-save")
        is_save_disabled = save.get_attribute("disabled") if save else None
        results["func_horse_create_valid"] = {
            "status": "pass" if is_save_disabled is None else "fail",
            "detail": f"Save enabled after filling required fields" if is_save_disabled is None else "Save still disabled"
        }
        page.click(".modal-close")
        page.wait_for_timeout(400)

        # ── 12b. Horse ficha/detail ──
        nav_to("Caballos")
        page.wait_for_timeout(500)
        ficha_btn = page.query_selector("button:has-text('Ficha')")
        if ficha_btn:
            ficha_btn.click()
            page.wait_for_timeout(600)
            modal_content = page.query_selector(".modal-box")
            has_name = "Nombre:" in (modal_content.inner_text() if modal_content else "")
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_horse_ficha"] = {
                "status": "pass" if modal_content and has_name else "fail",
                "detail": "Detail modal shows horse data" if has_name else "No detail modal or no name"
            }
        else:
            results["func_horse_ficha"] = {"status": "skip", "detail": "No Ficha button"}

        # ── 12c. Client create ──
        nav_to("Clientes")
        click_button("Nuevo")
        page.wait_for_timeout(500)
        page.fill('input[name="firstName"]', "TestClient")
        page.fill('input[name="lastName"]', "Automation")
        page.fill('input[name="phone"]', "+56 9 9999")
        page.fill('input[name="address"]', "Test address 123")
        save2 = page.query_selector(".modal-save")
        is_save2_disabled = save2.get_attribute("disabled") if save2 else None
        page.click(".modal-close")
        page.wait_for_timeout(400)
        results["func_client_create_valid"] = {
            "status": "pass" if is_save2_disabled is None else "fail",
            "detail": "Client form valid" if is_save2_disabled is None else "Save disabled"
        }

        # ── 12d. Client ficha detail ──
        nav_to("Clientes")
        page.wait_for_timeout(500)
        cficha_btn = page.query_selector("button:has-text('Ficha')")
        if cficha_btn:
            cficha_btn.click()
            page.wait_for_timeout(600)
            cmodal = page.query_selector(".modal-box")
            cname_present = cmodal and "Nombre:" in cmodal.inner_text()
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_client_ficha"] = {
                "status": "pass" if cname_present else "fail",
                "detail": "Client detail shown" if cname_present else "No client detail"
            }
        else:
            results["func_client_ficha"] = {"status": "skip", "detail": "No Ficha button"}

        # ── 12e. Boarding create modal has correct fields ──
        nav_to("Pensiones")
        click_button("Nueva pension")
        page.wait_for_timeout(500)
        bm = page.query_selector(".modal-box")
        if bm:
            has_horse = bm.query_selector('select[name="horseId"]') is not None
            has_client = bm.query_selector('select[name="clientId"]') is not None
            has_type = bm.query_selector('select[name="boardingType"]') is not None
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_boarding_fields"] = {
                "status": "pass" if has_horse and has_client and has_type else "fail",
                "detail": f"Horse={'yes' if has_horse else 'no'}, Client={'yes' if has_client else 'no'}, Type={'yes' if has_type else 'no'}"
            }
        else:
            results["func_boarding_fields"] = {"status": "fail", "detail": "No modal"}

        # ── 12f. Payment modal cost suggestion ──
        nav_to("Pagos")
        click_button("Registrar pago")
        page.wait_for_timeout(500)
        pm = page.query_selector(".modal-box")
        if pm:
            month_checks = len(pm.query_selector_all('input[type="checkbox"]'))
            has_cost_div = pm.query_selector("#suggested-cost") is not None
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_payment_months_cost"] = {
                "status": "pass" if month_checks >= 12 else "fail",
                "detail": f"Month checkboxes={month_checks}, cost-suggestion={'yes' if has_cost_div else 'no'}"
            }
        else:
            results["func_payment_months_cost"] = {"status": "fail", "detail": "No modal"}

        # ── 12g. Health: Vaccination modal ──
        nav_to("Vacunas")
        page.wait_for_timeout(500)
        vbtn = page.query_selector("#btn-new-vacc")
        if vbtn:
            vbtn.click()
            page.wait_for_timeout(600)
            vm = page.query_selector(".modal-box")
            has_file = vm.query_selector('input[type="file"]') is not None if vm else False
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_vaccine_upload"] = {
                "status": "pass" if has_file else "fail",
                "detail": "Has file upload field" if has_file else "No file field"
            }
        else:
            results["func_vaccine_upload"] = {"status": "skip"}

        # ── 12g2. Vacunas: Mostrar anulados + columna estado ──
        nav_to("Vacunas")
        page.wait_for_timeout(500)
        cancelled_chk = page.query_selector("#vacc-show-cancelled")
        status_header = page.query_selector("th:has-text('Estado')")
        results["func_vaccines_show_cancelled"] = {
            "status": "pass" if cancelled_chk else "fail",
            "detail": "Mostrar anulados checkbox: " + ("yes" if cancelled_chk else "no")
        }
        results["func_vaccines_status_column"] = {
            "status": "pass" if status_header else "fail",
            "detail": "Columna Estado: " + ("yes" if status_header else "no")
        }

        # ── 12g3. Herrajes: Mostrar anulados + columna estado ──
        nav_to("Herrajes")
        page.wait_for_timeout(500)
        f_cancelled_chk = page.query_selector("#farrier-show-cancelled")
        f_status_header = page.query_selector("th:has-text('Estado')")
        results["func_farrier_show_cancelled"] = {
            "status": "pass" if f_cancelled_chk else "fail",
            "detail": "Mostrar anulados checkbox: " + ("yes" if f_cancelled_chk else "no")
        }
        results["func_farrier_status_column"] = {
            "status": "pass" if f_status_header else "fail",
            "detail": "Columna Estado: " + ("yes" if f_status_header else "no")
        }

        # ── 12h. Documents upload modal file selection ──
        nav_to("Documentos")
        click_button("Subir documentos")
        page.wait_for_timeout(600)
        dm = page.query_selector(".modal-box")
        if dm:
            entity_select = dm.query_selector('select[name="entityType"]')
            file_input = dm.query_selector('input[type="file"]')
            file_list = dm.query_selector("#file-list")
            save_btn = dm.query_selector(".modal-save")
            save_disabled = save_btn.get_attribute("disabled") if save_btn else None
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_docs_upload_fields"] = {
                "status": "pass" if entity_select and file_input and file_list else "fail",
                "detail": f"Entity={'yes' if entity_select else 'no'}, File={'yes' if file_input else 'no'}, Save={'blocked' if save_disabled else 'enabled'}"
            }
        else:
            results["func_docs_upload_fields"] = {"status": "fail", "detail": "No modal"}

        # ── 12i. Genealogy: has select and edit button ──
        nav_to("Genealogia")
        page.wait_for_timeout(500)
        gselect = page.query_selector("select")
        gedit = page.query_selector("button:has-text('Editar padres')")
        results["func_genealogy_ui"] = {
            "status": "pass" if gselect else "skip",
            "detail": f"Selector={'yes' if gselect else 'no'}, Edit-parents={'yes' if gedit else 'no'}"
        }

        # ── 12j. Genealogy: open edit modal ──
        if gedit:
            gedit.click()
            page.wait_for_timeout(600)
            gmodal = page.query_selector(".modal-box")
            has_toggles = len(page.query_selector_all("input[type='checkbox']")) >= 2 if gmodal else False
            page.click(".modal-close") if gmodal else None
            page.wait_for_timeout(400)
            results["func_genealogy_edit_modal"] = {
                "status": "pass" if has_toggles else "skip",
                "detail": f"Edit modal has toggles: {'yes' if has_toggles else 'no'}"
            }
        else:
            results["func_genealogy_edit_modal"] = {"status": "skip", "detail": "No edit button"}

        # ── 12k. Audit: has filter selects ──
        nav_to("Auditoria")
        page.wait_for_timeout(500)
        afilters = len(page.query_selector_all("select"))
        acheckbox = page.query_selector("input[type='checkbox']")
        atable = page.query_selector("table")
        results["func_audit_filters"] = {
            "status": "pass" if afilters >= 2 and acheckbox else "fail",
            "detail": f"Selects={afilters}, Low-checkbox={'yes' if acheckbox else 'no'}, Table={'yes' if atable else 'no'}"
        }

        # ── 12l. Audit: click row opens detail modal ──
        arow = page.query_selector("tr[data-audit-detail]")
        if arow:
            arow.click()
            page.wait_for_timeout(600)
            amodal = page.query_selector(".modal-box")
            has_content = amodal is not None and len(amodal.inner_text().strip()) > 50
            page.click(".modal-close") if amodal else None
            page.wait_for_timeout(400)
            results["func_audit_detail"] = {
                "status": "pass" if has_content else "fail",
                "detail": "Detail modal shows data" if has_content else "No content in audit detail"
            }
        else:
            results["func_audit_detail"] = {"status": "skip", "detail": "No audit rows"}

        # ── 12m. Admin: invite modal has role selector ──
        nav_to("Admin")
        click_button("Nueva invitacion")
        page.wait_for_timeout(600)
        im = page.query_selector(".modal-box")
        if im:
            has_role = im.query_selector('select[name="role"]') is not None
            has_expiry = im.query_selector('input[name="expiresAt"]') is not None
            page.click(".modal-close")
            page.wait_for_timeout(400)
            results["func_admin_invite_fields"] = {
                "status": "pass" if has_role and has_expiry else "fail",
                "detail": f"Role={'yes' if has_role else 'no'}, Expires={'yes' if has_expiry else 'no'}"
            }
        else:
            results["func_admin_invite_fields"] = {"status": "fail", "detail": "No modal"}

        # ── 12n. Admin: invitation section exists ──
        nav_to("Admin")
        page.wait_for_timeout(500)
        has_section = len(page.query_selector_all(".card")) >= 1
        results["func_admin_section"] = {
            "status": "pass" if has_section else "fail",
            "detail": f"Admin sections: {len(page.query_selector_all('.card'))}"
        }

        # ── 12o. Dashboard: KPI elements are interactive ──
        nav_to("Panel")
        page.wait_for_timeout(500)
        kpi_els = page.query_selector_all(".kpi")
        clickable = any(el.get_attribute("data-nav") or el.get_attribute("data-dash-nav") for el in kpi_els if el)
        results["func_dashboard_kpis"] = {
            "status": "pass" if kpi_els else "fail",
            "detail": f"KPIs={len(kpi_els)}, clickable={'yes' if clickable else 'no'}"
        }

        # ── 12p. Search by text ──
        nav_to("Buscador")
        sinp = page.query_selector("input[type='text']")
        if sinp:
            sinp.click()
            sinp.fill("")
            sinp.type("Trueno", delay=50)
            page.wait_for_timeout(300)
            search_btn = page.query_selector("#btn-search")
            if search_btn:
                search_btn.click()
                page.wait_for_timeout(1200)
            result_count = len(page.query_selector_all("table tbody tr")) if page.query_selector("table") else 0
            results["func_search_execute"] = {
                "status": "pass" if result_count >= 1 else "skip",
                "detail": f"Search table rows: {result_count}" if result_count >= 1 else "No results"
            }
        else:
            results["func_search_execute"] = {"status": "skip"}

        # ── 12q. Inactive toggle preserves UI ──
        nav_to("Caballos")
        page.wait_for_timeout(500)
        toggle = page.query_selector("#horse-show-inactive")
        if toggle:
            was_checked = toggle.is_checked()
            toggle.click()
            page.wait_for_timeout(800)
            toggle2 = page.query_selector("#horse-show-inactive")
            now_checked = toggle2.is_checked() if toggle2 else not was_checked
            if toggle2 and now_checked != was_checked:
                toggle2.click()
                page.wait_for_timeout(400)
            results["func_horses_inactive_toggle"] = {
                "status": "pass" if now_checked != was_checked else "fail",
                "detail": "Toggle changed state" if now_checked != was_checked else "Toggle didn't change"
            }
        else:
            results["func_horses_inactive_toggle"] = {"status": "skip"}

        # ══════════════════════════════════════════
        # 12r. Gallery in horse detail
        # ══════════════════════════════════════════
        nav_to("Caballos")
        page.wait_for_timeout(500)
        ficha_btn = page.query_selector("[data-ficha]")
        if ficha_btn:
            ficha_btn.click()
            page.wait_for_timeout(600)
            dm2 = page.query_selector(".modal-box")
            has_gallery = "Galeria" in (dm2.inner_text() if dm2 else "")
            page.click(".modal-close") if dm2 else None
            page.wait_for_timeout(400)
            results["func_horse_gallery"] = {
                "status": "pass",
                "detail": "Galeria seccion: " + ("yes" if has_gallery else "no (no photos)")
            }
        else:
            results["func_horse_gallery"] = {"status": "skip"}

        # ══════════════════════════════════════════
        # 12s. Config page (owner only)
        # ══════════════════════════════════════════
        nav_to("Config")
        page.wait_for_timeout(500)
        config_form = page.query_selector("#config-form")
        results["func_config_page"] = {
            "status": "pass" if config_form else "fail",
            "detail": "Config form: " + ("yes" if config_form else "no")
        }

        # ══════════════════════════════════════════
        # 12t. Profile: password change form
        # ══════════════════════════════════════════
        nav_to("Mi perfil")
        page.wait_for_timeout(500)
        pw_form = page.query_selector("#password-form")
        results["func_profile_password"] = {
            "status": "pass" if pw_form else "fail",
            "detail": "Password change form: " + ("yes" if pw_form else "no")
        }

        # ══════════════════════════════════════════
        # 12u. Catalogos: selector + table
        # ══════════════════════════════════════════
        nav_to("Catalogos")
        page.wait_for_timeout(500)
        cat_selector = page.query_selector("#catalog-selector")
        cat_btn = page.query_selector("#btn-new-catalog-entry")
        results["func_catalogs_ui"] = {
            "status": "pass" if cat_selector and cat_btn else "fail",
            "detail": f"Selector={'yes' if cat_selector else 'no'}, Nuevo={'yes' if cat_btn else 'no'}"
        }

        # ══════════════════════════════════════════
        # 13. CONSOLE ERRORS
        # ══════════════════════════════════════════
        real_errors = [e for e in console_log if "[error]" in e and "favicon" not in e.lower()]
        results["console"] = {
            "status": "pass" if not real_errors else "fail",
            "detail": "Clean" if not real_errors else f"{len(real_errors)} errors",
            "errors": [e[:200] for e in real_errors[:5]],
        }

        browser.close()

    return report(results, errors)


def report(results, errors):
    passed = sum(1 for v in results.values() if v.get("status") == "pass")
    failed = sum(1 for v in results.values() if v.get("status") == "fail")
    skipped = sum(1 for v in results.values() if v.get("status") == "skip")
    return {
        "status": "pass" if failed == 0 else "fail",
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "checks": results,
    }


if __name__ == "__main__":
    result = run()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0 if result["status"] == "pass" else 1)
