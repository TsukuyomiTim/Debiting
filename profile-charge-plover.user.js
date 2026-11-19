// ==UserScript==
// @name         Profile Charge Helper (Plover)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Создание формы Charge с профиля игрока (create/671)
// @author       Plover
// @updateURL    https://github.com/TsukuyomiTim/Debiting/raw/refs/heads/main/profile-charge-plover.user.js
// @downloadURL  https://github.com/TsukuyomiTim/Debiting/raw/refs/heads/main/profile-charge-plover.user.js
// @match        https://cc.boadmin.org/ru/Users/Summary/*
// @match        https://gm.boadmin.org/ru/Users/Summary/*
// @match        https://dy.boadmin.org/ru/Users/Summary/*
// @match        https://rs.boadmin.org/ru/Users/Summary/*
// @match        https://kn.boadmin.org/ru/Users/Summary/*
// @match        https://kt.boadmin.org/ru/Users/Summary/*
// @match        https://ak.boadmin.org/ru/Users/Summary/*
// @match        https://tasks.deltasystem.tech/servicedesk/customer/portal/22/create/671*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const FORM_URL = 'https://tasks.deltasystem.tech/servicedesk/customer/portal/22/create/671';
    const DATA_KEY = 'plover_profile_charge_v1';

    const HOST_PROJECT = {
        'cc.boadmin.org': 'Cat',
        'gm.boadmin.org': 'Gama',
        'dy.boadmin.org': 'Daddy',
        'rs.boadmin.org': 'R7',
        'kn.boadmin.org': 'Kent',
        'kt.boadmin.org': 'Kometa',
        'ak.boadmin.org': 'Arkada'
    };

    const PROJECT_VALUES = {
        'Cat': '13907', 'Gama': '13908', 'Daddy': '13909', 'Kent': '13910',
        'R7': '13911', 'Kometa': '13912', 'Mers': '13914', 'Arkada': '14500'
    };

    const CURRENCY_VALUES = {
        'USD': '14101', 'EUR': '14102', 'RUB': '14103', 'BYN': '14104',
        'USDT': '14105', 'BTC': '14106', 'LTC': '14107', 'ETH': '14108',
        'KZT': '14109', 'BRL': '14110', 'UZS': '14912', 'TRX': '17347'
    };

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function getJq() {
        try {
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            return w.AJS?.$ || w.jQuery || w.$ || null;
        } catch (e) {
            return null;
        }
    }

    function detectProject() {
        return HOST_PROJECT[location.hostname] || null;
    }

    function detectPlayerId() {
        const m = location.pathname.match(/\/Users\/Summary\/(\d+)/i);
        return m ? m[1] : null;
    }

    /** Strict VIP / HighRoll only — ignore VipCashback and similar. */
    function detectStrictVip() {
        const text = (document.body?.innerText || '').replace(/\u00a0/g, ' ');
        const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(0, 80)) {
            if (/\bVipCashback\b/i.test(line) || /\bVIP[\s_-]?Cashback\b/i.test(line)) continue;
            if (/\bHigh[\s_-]?Roll\b/i.test(line)) return true;
            if (/(^|[^a-zA-Z])VIP([^a-zA-Z]|$)/i.test(line) && !/cashback/i.test(line)) return true;
        }
        const tags = [...document.querySelectorAll('span, a, div, label, li, b, strong')];
        return tags.some(n => {
            if (n.children.length > 3) return false;
            const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
            if (/^High[\s_-]?Roll$/i.test(t)) return true;
            if (/^VIP$/i.test(t)) return true;
            return false;
        });
    }

    /* ---------- Profile UI ---------- */

    function createProfilePanel() {
        if (document.getElementById('plover-charge-panel')) return;
        if (!detectProject() || !detectPlayerId()) return;

        const panel = document.createElement('div');
        panel.id = 'plover-charge-panel';
        panel.innerHTML = `
            <style>
                #plover-charge-panel {
                    position: fixed; top: 6px; right: 720px; z-index: 999999;
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    border: 1px solid #334155; border-radius: 8px;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                    font-family: system-ui, sans-serif; color: #e2e8f0;
                    padding: 6px 8px; min-width: 0;
                }
                #plover-charge-panel .title {
                    font-size: 9px; font-weight: 600; margin-bottom: 4px; text-align: center;
                    background: linear-gradient(90deg, #38bdf8, #a78bfa);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                #plover-charge-panel button {
                    width: auto; border: none; border-radius: 6px; padding: 5px 10px;
                    background: #7c3aed; color: #fff; font-weight: 600; font-size: 11px; cursor: pointer;
                    white-space: nowrap;
                }
                #plover-charge-panel button:hover { filter: brightness(1.12); }
            </style>
            <div class="title">Plover</div>
            <button id="plover-charge-open">Списание</button>
        `;
        document.body.appendChild(panel);
        panel.querySelector('#plover-charge-open').onclick = openChargeForm;
    }

    function openChargeForm() {
        const project = detectProject();
        const playerId = detectPlayerId();
        if (!project || !playerId) {
            alert('Не удалось определить проект или ID игрока');
            return;
        }

        const isVip = detectStrictVip();
        const payload = {
            source: 'profile-charge',
            playerId,
            project,
            isVip,
            description: 'Ошибочное зачисление от ПС, списание по запросу от ПС',
            amount: 'XXX',
            currency: 'RUB',
            token: 'XXX',
            psp: 'XXX',
            ticketLink: '.',
            timestamp: Date.now()
        };
        GM_setValue(DATA_KEY, JSON.stringify(payload));

        const params = new URLSearchParams();
        params.set('summary', [playerId, project].filter(Boolean).join(' '));
        params.set('description', 'Ошибочное зачисление от ПС, списание по запросу от ПС');
        if (playerId) params.set('customfield_12600', playerId);
        params.set('customfield_12602', 'XXX');
        params.set('customfield_12603', 'XXX');
        params.set('customfield_12605', 'XXX');
        params.set('customfield_12606', '.');
        params.set('source', 'profile-charge');
        GM_openInTab(FORM_URL + '?' + params.toString(), { active: true });
    }

    /* ---------- Form fill helpers ---------- */

    function setInputByName(name, value) {
        const el = document.querySelector('[name="' + name + '"], #' + name);
        if (!el || value == null) return false;
        el.focus();
        el.value = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function setInputByLabel(labelText, value) {
        if (value == null || value === '') return false;
        const labels = [...document.querySelectorAll('label')];
        const want = labelText.trim().toLowerCase();
        const label = labels.find(l => l.textContent.trim().toLowerCase().replace(/\*$/, '') === want);
        const group = label ? (label.closest('.field-group') || label.parentElement) : null;
        const input = group?.querySelector('input:not([type="hidden"]), textarea');
        if (!input) return setInputByName(labelText, value);
        input.focus();
        input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function applyNativeSelect(select, value, visibleText) {
        if (!select) return false;
        let opt = [...select.options].find(o =>
            String(o.value) === String(value) || (visibleText && o.text.trim() === visibleText)
        );
        if (!opt && visibleText) {
            opt = [...select.options].find(o => o.text.trim().toLowerCase() === String(visibleText).toLowerCase());
        }
        if (!opt && value) {
            opt = document.createElement('option');
            opt.value = String(value);
            opt.textContent = visibleText || String(value);
            select.appendChild(opt);
        }
        if (!opt) return false;
        [...select.options].forEach(o => { o.selected = o === opt; });
        select.value = String(opt.value);
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        const $ = getJq();
        if ($) {
            try {
                $(select).val(String(opt.value)).trigger('change');
                try { $(select).select2('val', String(opt.value)); } catch (e) {}
                try { $(select).select2('data', { id: String(opt.value), text: opt.text.trim() }); } catch (e) {}
                $(select).trigger('change');
            } catch (e) {}
        }
        return true;
    }

    function setSelectByLabel(labelText, value) {
        const labels = [...document.querySelectorAll('label')];
        const label = labels.find(l => l.textContent.trim().toLowerCase().includes(labelText.toLowerCase()));
        const select = (label?.closest('.field-group') || label?.parentElement)?.querySelector('select');
        if (!select) return false;
        return applyNativeSelect(select, value);
    }

    function setSelectByOptionText(labelText, optionText) {
        if (!optionText) return false;
        const want = labelText.trim().toLowerCase();
        const labels = [...document.querySelectorAll('label')];
        const label = labels.find(l => l.textContent.trim().toLowerCase().replace(/\*$/, '') === want)
            || labels.find(l => l.textContent.trim().toLowerCase().includes(want));
        const select = (label?.closest('.field-group') || label?.parentElement)?.querySelector('select');
        if (!select) return false;
        const opt = [...select.options].find(o => o.text.trim().toLowerCase() === String(optionText).toLowerCase())
            || [...select.options].find(o => o.text.trim().toLowerCase().includes(String(optionText).toLowerCase()));
        if (!opt) return false;
        return applyNativeSelect(select, opt.value, opt.text.trim());
    }

    function setSelectById(fieldId, value, visibleText) {
        const select = document.querySelector('#' + fieldId + ', [name="' + fieldId + '"]');
        if (!select) return false;
        return applyNativeSelect(select, value, visibleText);
    }

    async function clickSelect2Label(text) {
        const labels = [...document.querySelectorAll('.select2-result-label, .select2-results__option')];
        const hit = labels.find(n => n.textContent.trim() === text)
            || labels.find(n => n.textContent.trim().toLowerCase().includes(String(text).toLowerCase()));
        if (!hit) return false;
        hit.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        hit.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        hit.click();
        return true;
    }

    async function forceCurrency(currencyCode) {
        if (!currencyCode) return;
        const group = [...document.querySelectorAll('.field-group, .field')].find(g => {
            const lab = (g.querySelector('label')?.textContent || '').replace(/\s+/g, ' ').trim();
            return /^currency\*?$/i.test(lab);
        });
        const select = document.querySelector('#customfield_10805, [name="customfield_10805"]')
            || group?.querySelector('select');
        if (!select) return;

        let opt = [...select.options].find(o => o.text.trim() === currencyCode);
        if (!opt && CURRENCY_VALUES[currencyCode]) {
            opt = document.createElement('option');
            opt.value = String(CURRENCY_VALUES[currencyCode]);
            opt.textContent = currencyCode;
            select.appendChild(opt);
        }
        if (!opt) return;
        const value = opt.value;
        applyNativeSelect(select, value, currencyCode);

        if (String(select.value) !== String(value)) {
            const s2 = document.querySelector('#s2id_' + (select.id || 'customfield_10805'))
                || group?.querySelector('.select2-container');
            const choice = s2?.querySelector('.select2-choice');
            if (choice) {
                choice.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                await sleep(300);
                await clickSelect2Label(currencyCode);
                applyNativeSelect(select, value, currencyCode);
            }
        }
    }

    function writeDescription(text) {
        const desc = document.querySelector('#description, [name="description"], textarea#description, textarea[name="description"]');
        if (desc) {
            desc.value = text;
            desc.dispatchEvent(new Event('input', { bubbles: true }));
            desc.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const iframe = document.querySelector('iframe.tox-edit-area__iframe, .wiki-edit-content iframe, iframe[id*="description"]');
        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            iframe.contentDocument.body.innerText = text;
        }
    }

    function addForceBtn(text, fn) {
        if (document.getElementById('plover-charge-force')) return;
        const btn = document.createElement('button');
        btn.id = 'plover-charge-force';
        btn.textContent = text;
        btn.style.cssText = 'position:fixed;bottom:25px;right:25px;z-index:999999;background:#7c3aed;color:white;border:none;padding:14px 22px;border-radius:10px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(124,58,237,0.5);font-size:14px;';
        btn.onclick = fn;
        document.body.appendChild(btn);
    }

    async function fillChargeForm(data) {
        const summary = [data.playerId, data.project].filter(Boolean).join(' ');
        setInputByName('summary', summary);
        setInputByLabel('Summary', summary);
        writeDescription(data.description || '');

        if (data.project) {
            if (PROJECT_VALUES[data.project]) setSelectByLabel('Project', PROJECT_VALUES[data.project]);
            setSelectByOptionText('Project', data.project);
        }

        setSelectByLabel('Department', '13918');
        setSelectByOptionText('Department', 'Support');

        if (data.playerId) {
            setInputByLabel('Player ID', data.playerId);
            setInputByName('customfield_12600', data.playerId);
        }

        setSelectByLabel('Player VIP', data.isVip ? '13928' : '13929');
        setSelectByOptionText('Player VIP', data.isVip ? 'Yes' : 'No');

        setSelectByLabel('Charge Amount Range', '14580');
        setSelectByOptionText('Charge Amount Range', 'less than 100k')
            || setSelectByOptionText('Charge Amount Range', 'Less than 100k')
            || setSelectByOptionText('Please Indicate Charge Range', 'less than 100k');

        if (data.amount != null) {
            setInputByLabel('Charge Amount', data.amount);
            setInputByName('customfield_12602', String(data.amount));
        }

        setSelectByOptionText('Currency', 'RUB');
        if (CURRENCY_VALUES.RUB) {
            setSelectById('customfield_10805', CURRENCY_VALUES.RUB, 'RUB');
            setSelectById('customfield_12801', CURRENCY_VALUES.RUB, 'RUB');
        }
        await forceCurrency('RUB');

        if (data.token) {
            setInputByLabel('Token', data.token);
            setInputByName('customfield_12603', data.token);
        }

        setSelectByLabel('Token status', '13940');
        setSelectByOptionText('Token status', 'Completed');

        if (data.psp) {
            setInputByLabel('PSP', data.psp);
            setInputByName('customfield_12605', data.psp);
        }

        const ticketLink = data.ticketLink != null ? data.ticketLink : '.';
        setInputByLabel('Ticket Link', ticketLink);
        setInputByName('customfield_12606', ticketLink);

        console.log('[Plover charge]', data);
    }

    function startFormFill() {
        const src = new URLSearchParams(location.search).get('source');
        if (src && src !== 'profile-charge') return;

        const raw = GM_getValue(DATA_KEY);
        if (!raw) return;
        let data;
        try { data = JSON.parse(raw); } catch { return; }
        if (data.source && data.source !== 'profile-charge') return;
        if (Date.now() - data.timestamp > 15 * 60 * 1000) return;

        const run = () => fillChargeForm(data);
        addForceBtn('🔄 Заполнить Charge', run);
        setTimeout(run, 1500);
        setTimeout(run, 3000);
    }

    /* ---------- Boot ---------- */

    if (/\.boadmin\.org$/i.test(location.hostname) && /\/Users\/Summary\//i.test(location.pathname)) {
        setTimeout(createProfilePanel, 800);
        setTimeout(createProfilePanel, 2000);
    } else if (location.href.includes('/create/671')) {
        startFormFill();
    }
})();
