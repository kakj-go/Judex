import { test, expect } from "@playwright/test";
test("studio is the only runtime; obsolete design names resolve to studio", async ({
  page,
}) => {
  for (const design of ["studio", "mail", "map", "chat"]) {
    await page.goto("/?design=" + design);
    await expect(page.locator(".judex-studio-next")).toBeVisible();
    await expect(page).toHaveURL(/design=studio/);
    await expect(page.locator(".judex-design-switch")).toHaveCount(0);
  }
});
test("tree lays cards left to right, collapses, opens in place and preserves zoom", async ({
  page,
}) => {
  await page.goto("/?design=studio&view=plan&item=leaf-first");
  const parent = page.getByTestId("work-task-build"),
    child = page.getByTestId("work-task-empty-state");
  expect((await child.boundingBox())!.x).toBeGreaterThan(
    (await parent.boundingBox())!.x,
  );
  await page
    .getByRole("button", {
      name: "展开或收起“让任务创建和列表顺畅可用”",
      exact: true,
    })
    .click();
  await expect(child).toHaveCount(0);
  await page.getByRole("button", { name: "展开全部", exact: true }).click();
  await expect(child).toHaveCount(1);
  await page.getByRole("button", { name: "缩小", exact: true }).click();
  await parent.click();
  await expect(page.getByRole("dialog")).toContainText(
    "让任务创建和列表顺畅可用",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "关闭", exact: true })
    .click();
  await expect(page.locator(".judex-task-tree-tools")).toContainText("70%");
  await page.getByRole("checkbox", { name: "显示前置依赖" }).uncheck();
  await expect(page.locator("path.judex-task-tree-dependency")).toHaveCount(0);
  await page.getByRole("button", { name: "展开画布", exact: true }).click();
  await expect(page.locator(".judex-task-tree-expanded")).toBeVisible();
  await page.getByRole("button", { name: "适应画布", exact: true }).click();
  await page.getByRole("button", { name: "收起画布", exact: true }).click();
});
test("a new child is a draft linked to the intended parent and plan", async ({
  page,
}) => {
  await page.goto("/?design=studio&view=plan&item=leaf-first");
  await page
    .getByRole("button", {
      name: "为“让任务创建和列表顺畅可用”拆分子任务",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("new-work-parent")).toHaveValue("build");
  await page.getByTestId("new-work-title").fill("重复提交边界核对");
  await page.getByTestId("new-work-description").fill("核对重复提交时的行为");
  await page.getByTestId("new-work-criteria").fill("提供复现步骤和结果");
  await page.getByTestId("create-work-draft").click();
  const task = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("judex.work.demo.v4")!).tasks.at(-1),
  );
  expect(task.parentId).toBe("build");
  expect(task.planId).toBe("leaf-first");
  expect(task.status).toBe("draft");
});
test("card list supports owner search, status filtering and detail navigation", async ({
  page,
}) => {
  await page.goto("/?design=studio&view=tasks");
  await expect(
    page.locator(".judex-task-card-grid .judex-task-card"),
  ).toHaveCount(6);
  await page
    .getByRole("textbox", { name: "查找任务、交付内容或负责人" })
    .fill("顾言");
  await expect(page.locator(".judex-task-card")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "按状态筛选" })
    .selectOption("accepted");
  await expect(page.locator(".judex-task-card")).toHaveCount(0);
  await page.getByRole("combobox", { name: "按状态筛选" }).selectOption("all");
  await page.getByTestId("work-task-build").click();
  await expect(page.getByTestId("task-detail")).toBeVisible();
});
test("all actions includes receipt and reviewer work, with English and dark canvas", async ({
  page,
}) => {
  await page.goto("/?design=studio");
  await page.getByTestId("work-person").selectOption("林然");
  await page.getByTestId("work-nav-decisions").click();
  await expect(page.getByRole("heading", { name: "等待我验收" })).toBeVisible();
  await page.goto("/?design=studio&view=plan&item=leaf-first");
  await page.getByTestId("next-language").click();
  await page.getByTestId("next-theme").click();
  await expect(
    page.getByRole("button", { name: "Fit canvas", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".judex-app")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("closing an inner acceptance dialog keeps the tree task preview open", async ({
  page,
}) => {
  await page.goto("/?design=studio");
  await page.getByTestId("work-person").selectOption("林然");
  await page.goto("/?design=studio&view=plan&item=leaf-first");
  await page.getByTestId("work-task-guide").click();
  await page.getByTestId("accept-task").click();
  await expect(page.getByRole("dialog")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByTestId("task-detail")).toBeVisible();
});
