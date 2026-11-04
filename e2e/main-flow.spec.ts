import { test, expect } from '@playwright/test';

test('完整主流程：登录 -> 查询行情 -> 登出', async ({ page }) => {
  // 1. 登录
  await page.goto('/login');
  await page.fill('input[placeholder*="用户名"]', 'admin');
  await page.fill('input[placeholder*="密码"]', 'admin123');
  await page.click('button:has-text("登 录")');

  // 2. 验证登录成功并跳转
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Fin Data')).toBeVisible();

  // 3. 进入行情数据页面
  await page.click('text=行情数据');
  await expect(page).toHaveURL('/market-data');

  // 4. 验证表格渲染出数据
  await expect(page.locator('thead')).toContainText('股票代码');
  await expect(page.locator('tbody tr').first()).toBeVisible();

  // 5. 登出
  await page.click('button:has-text("退出登录")');
  await expect(page).toHaveURL('/login');
});
