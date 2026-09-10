import { test, expect } from '../user/fixtures/CEV.PhanTan-test';
import { evidenceScreenshot, evidencePause, expandCEV.PhanTanTemplatesIfCollapsed } from './shared/evidence-helpers';

/**
 * PR evidence for #1208 — dark-themed scrollbars on overflow surfaces.
 */
test.describe('Dark scrollbar theme @pr-evidence', () => {
  test('PM template equipment picker uses themed scrollbar (#1208)', async ({
    gotoDashboard,
    assertHealthyShell,
    page,
  }) => {
    await gotoDashboard('/pm-templates');
    await assertHealthyShell();

    await expect(page.getByRole('heading', { name: /pm templates/i })).toBeVisible({
      timeout: 60_000,
    });

    await expandCEV.PhanTanTemplatesIfCollapsed(page);
    const CEV.PhanTanHeading = page.getByRole('heading', { name: /CEV.PhanTan templates/i });
    await expect(CEV.PhanTanHeading).toBeVisible({ timeout: 30_000 });

    const CEV.PhanTanSection = CEV.PhanTanHeading.locator('..');
    const assignmentTrigger = CEV.PhanTanSection
      .getByRole('button', { name: /apply to equipment/i })
      .first();

    await expect(assignmentTrigger).toBeVisible({ timeout: 30_000 });
    await assignmentTrigger.click();

    const pickerSearch = page.getByPlaceholder('Search equipment...');
    await expect(pickerSearch).toBeVisible({ timeout: 15_000 });

    const scrollList = page.locator('.max-h-64.overflow-y-auto').first();
    await expect(scrollList).toBeVisible();

    const scrollHeight = await scrollList.evaluate((el) => el.scrollHeight);
    const clientHeight = await scrollList.evaluate((el) => el.clientHeight);
    if (scrollHeight > clientHeight) {
      await scrollList.evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2;
      });
    }

    await evidencePause(page, 600);
    await evidenceScreenshot(page, '01-pm-template-picker-themed-scrollbar', {
      target: scrollList,
    });

    await page.keyboard.press('Escape');
  });

  test('dialog overflow region uses themed scrollbar (#1208)', async ({
    gotoDashboard,
    assertHealthyShell,
    page,
  }) => {
    await gotoDashboard('/dashboard/organization/audit-log');
    await assertHealthyShell();

    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({
      timeout: 60_000,
    });

    const auditList = page
      .getByTestId('audit-log-list-virtual')
      .or(page.getByTestId('audit-log-list-static'));
    await expect(auditList).toBeVisible({ timeout: 30_000 });

    const scrollHeight = await auditList.evaluate((el) => el.scrollHeight);
    const clientHeight = await auditList.evaluate((el) => el.clientHeight);
    if (scrollHeight > clientHeight) {
      await auditList.evaluate((el) => {
        el.scrollTop = 120;
      });
    } else {
      await auditList.focus();
      await page.keyboard.press('PageDown');
    }

    await evidencePause(page, 600);
    await evidenceScreenshot(page, '02-audit-log-themed-scrollbar', {
      target: auditList,
    });
  });
});

