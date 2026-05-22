import { expect, test, type Page } from "@playwright/test";

async function startMission(page: Page) {
  await page.goto("/treinamento/mini-game");
  await page.getByRole("button", { name: /Iniciar simulacao/i }).click();
}

async function prepareAndSend(page: Page, suffix: string) {
  await page.getByRole("button", { name: /Preparar mensagem/i }).click();
  await page.getByRole("button", { name: /Abrir Instagram/i }).click();
  await expect(page.getByRole("textbox", { name: /Personalizar mensagem para Julia Santos/i })).toBeVisible();
  await personalizeAndSend(page, suffix);
}

async function personalizeAndSend(page: Page, suffix: string) {
  const composer = page.getByRole("textbox");
  await composer.fill(`${await composer.inputValue()} ${suffix}`);

  await page.getByRole("button", { name: /Validar personalizacao/i }).click();
  await expect(page.getByText("Personalizacao validada", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Confirmar envio/i }).click();
  await expect(page.getByText("Resposta recebida", { exact: true })).toBeVisible();
}

async function prepareAndSendCurrentMission(page: Page, suffix: string, openLabel: RegExp) {
  await page.getByRole("button", { name: /Preparar mensagem/i }).click();
  await page.getByRole("button", { name: openLabel }).click();
  await personalizeAndSend(page, suffix);
}

async function registerResponse(page: Page, responseLabel: RegExp) {
  await page.getByRole("button", { name: /Registrar avanco/i }).click();
  await expect(page.getByRole("dialog").getByText(/Registrar avanco da missao/i)).toBeVisible();
  await page.getByRole("button", { name: responseLabel }).click();
}

async function defineDestination(page: Page, routeLabel: RegExp) {
  await page.getByRole("button", { name: /Definir destino/i }).click();
  await expect(page.getByRole("dialog").getByText(/Definir proximo destino/i)).toBeVisible();
  await page.getByRole("button", { name: routeLabel }).click();
}

test("mini-game orienta o fluxo limpo da primeira missao", async ({ page }) => {
  await startMission(page);

  await expect(page.getByRole("button", { name: /Respondeu bem/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Missao de Campo/i })).toHaveCount(0);

  await prepareAndSend(page, "Posso te ouvir por aqui?");

  await expect(page.getByText(/Piora por volta das 6h40/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Registrar avanco/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Respondeu bem/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Missao de Campo/i })).toHaveCount(0);

  await registerResponse(page, /Respondeu bem/i);
  await expect(page.getByText("Resposta registrada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Definir destino/i })).toBeVisible();
  await expect(page.getByText(/Relato aponta atraso recorrente no Retiro por volta das 6h40/i)).toBeVisible();
  await expect(page.getByText(/Destino aguardando definicao/i)).toBeVisible();

  await defineDestination(page, /Missao de Campo/i);
  await expect(page.getByText("Registro consolidado", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Recibo da missao de Julia Santos/i).getByText(/Destino: Missao de Campo/i)).toBeVisible();
  await expect(page.getByText("Fluxo limpo", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Proxima missao/i }).click();
  await expect(page.getByRole("heading", { name: "Marcos Silva" })).toBeVisible();
});

test("mini-game registra correcoes e guardrail no percurso", async ({ page }) => {
  await startMission(page);

  await page.getByRole("button", { name: /Preparar mensagem/i }).click();
  await page.getByRole("button", { name: /Abrir Instagram/i }).click();
  await page.getByRole("button", { name: /Validar personalizacao/i }).click();
  await expect(page.getByText("Modelo sem voz manual", { exact: true })).toBeVisible();

  await personalizeAndSend(page, "Quero ouvir seu relato com cuidado.");
  await registerResponse(page, /Disparo automatico/i);
  await expect(page.getByText("Automacao indevida", { exact: true })).toBeVisible();

  await registerResponse(page, /Respondeu bem/i);
  await defineDestination(page, /Revisar depois/i);
  await expect(page.getByText("Missao parada sem motivo", { exact: true })).toBeVisible();

  await defineDestination(page, /Missao de Campo/i);
  await expect(page.getByText("Registro consolidado", { exact: true })).toBeVisible();
  await expect(
    page
      .getByText("Correcoes", { exact: true })
      .locator("..")
      .locator("p")
      .filter({ hasText: /^3$/ }),
  ).toBeVisible();
});

test("mini-game mostra espera quando sem retorno nao libera encaminhamento", async ({ page }) => {
  await startMission(page);
  await prepareAndSend(page, "Posso te ouvir por aqui?");

  await registerResponse(page, /Sem retorno/i);
  await expect(page.getByText("Em espera", { exact: true })).toBeVisible();
  await expect(page.getByText(/Sem retorno real, a conversa fica em espera/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Definir destino/i })).toHaveCount(0);
});

test("mini-game retoma checkpoint local depois de recarregar", async ({ page }) => {
  await startMission(page);
  await expect(page.getByRole("button", { name: /Mutar audio do mini-game/i })).toBeVisible();

  await page.getByRole("button", { name: /Preparar mensagem/i }).click();
  await page.getByRole("button", { name: /Abrir Instagram/i }).click();

  const composer = page.getByRole("textbox");
  await composer.fill(`${await composer.inputValue()} checkpoint preservado`);
  await page.getByRole("button", { name: /Validar personalizacao/i }).click();
  await expect(page.getByText("Personalizacao validada", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /Continuar treino/i })).toBeVisible();

  await page.getByRole("button", { name: /Continuar treino/i }).click();
  await expect(page.getByText("Personalizacao validada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Confirmar envio/i })).toBeEnabled();
  await expect(page.getByText(/checkpoint preservado/i)).toBeVisible();
});

test("mini-game recomenda revisoes a partir dos erros da trilha", async ({ page }) => {
  await startMission(page);

  await page.getByRole("button", { name: /Preparar mensagem/i }).click();
  await page.getByRole("button", { name: /Abrir Instagram/i }).click();
  await page.getByRole("button", { name: /Validar personalizacao/i }).click();
  await personalizeAndSend(page, "Quero ouvir seu relato com cuidado.");
  await registerResponse(page, /Disparo automatico/i);
  await registerResponse(page, /Respondeu bem/i);
  await defineDestination(page, /Revisar depois/i);
  await defineDestination(page, /Missao de Campo/i);
  await page.getByRole("button", { name: /Proxima missao/i }).click();

  await prepareAndSendCurrentMission(page, "Vou manter esse limite registrado.", /Abrir registro de escuta/i);
  await registerResponse(page, /Nao quer contato/i);
  await defineDestination(page, /Nao abordar/i);
  const marcosReceipt = page.getByLabel(/Recibo da missao de Marcos Silva/i);
  await expect(marcosReceipt.getByText("Bloqueada", { exact: true })).toBeVisible();
  await expect(marcosReceipt.getByText(/Restricao etica salva/i)).toBeVisible();
  await page.getByRole("button", { name: /Proxima missao/i }).click();

  await expect(page.getByRole("complementary").getByText("Simulacao operacional", { exact: true })).toBeVisible();
  await prepareAndSendCurrentMission(page, "Obrigado por confirmar esse horario.", /Abrir formulario/i);
  await registerResponse(page, /Quer ajudar/i);
  await expect(page.getByText("Destino da Minha Jornada", { exact: true })).toHaveCount(0);
  await defineDestination(page, /Missao de Campo/i);
  await page.getByRole("button", { name: /Concluir trilha/i }).click();

  await expect(page.getByText("Revisao recomendada", { exact: true })).toBeVisible();
  await expect(page.getByText("Revisar personalizacao", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Revisar abordagem manual", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Revisar destino da missao", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Competencias praticadas", { exact: true })).toBeVisible();
  await expect(page.getByText("Privacidade", { exact: true })).toBeVisible();
  await expect(page.getByText("Dominada", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Repetir missao com revisao/i }).click();
  await expect(page.getByRole("heading", { name: "Julia Santos" })).toBeVisible();
});

test("treinamento le resultado salvo do mini-game", async ({ page }) => {
  await page.goto("/treinamento");
  await page.evaluate(() => {
    localStorage.setItem("radar_training_mini_game_result_v1", JSON.stringify({
      cleanMissions: 2,
      completedAt: "2026-05-21T12:00:00.000Z",
      masteredKinds: ["response", "privacy", "routing"],
      reviewKinds: ["personalization", "automation"],
      totalCorrections: 2,
      version: 1,
    }));
  });

  await page.reload();
  await expect(page.getByText("Pratica concluida", { exact: true })).toBeVisible();
  await expect(page.getByText("3/5 competencias dominadas", { exact: true })).toBeVisible();
  await expect(page.getByText(/Revisar Simulador/i)).toBeVisible();
  const practicalChecklist = page.getByRole("button", { name: /Completei as fases praticas do modo treinamento/i });
  await expect(practicalChecklist).toContainText(/Confirmado automaticamente pelo simulador pratico/i);
  await practicalChecklist.click();
  await expect(practicalChecklist).toContainText(/Confirmado automaticamente pelo simulador pratico/i);
});

test("treinamento retoma progresso salvo depois de recarregar", async ({ page }) => {
  await page.goto("/treinamento");
  await page.evaluate(() => {
    localStorage.setItem("radar_training_progress_v1", JSON.stringify({
      completedPhases: ["fase1", "fase2"],
      ethicalChecks: ["e1", "e2"],
      finished: false,
      officialChecklist: ["c1", "c3"],
      version: 1,
    }));
    localStorage.setItem("radar_training_mini_game_result_v1", JSON.stringify({
      cleanMissions: 3,
      completedAt: "2026-05-21T12:00:00.000Z",
      masteredKinds: ["personalization", "automation", "response", "privacy", "routing"],
      reviewKinds: [],
      totalCorrections: 0,
      version: 1,
    }));
  });

  await page.reload();
  await expect(page.getByText("58%", { exact: true })).toBeVisible();
  await expect(page.getByText("Simulador", { exact: true })).toBeVisible();
  await expect(page.getByText("Concluido", { exact: true })).toBeVisible();
  await expect(page.getByText("Checklist", { exact: true })).toBeVisible();
  await expect(page.getByText("3/5", { exact: true })).toBeVisible();
  await expect(page.getByText(/Continuar na fase 3: Registrar resposta/i)).toBeVisible();
  await page.getByRole("button", { name: /Continuar fase/i }).click();
  await expect(page.getByText(/Fase 3 de 6/i)).toBeVisible();
  await page.getByRole("button", { name: /Voltar ao lobby do treinamento/i }).click();
  await expect(page.getByRole("button", { name: /Fase 1 Entender o Radar/i })).toContainText(/Entender o Radar/i);
  await expect(page.getByRole("button", { name: /Li o treinamento oficial do operador/i })).toHaveClass(/emerald/);
  await expect(page.getByRole("button", { name: /Completei as fases praticas do modo treinamento/i })).toHaveClass(/emerald/);
});

test("treinamento so libera conclusao com todos os requisitos", async ({ page }) => {
  await page.goto("/treinamento");
  await page.evaluate(() => {
    localStorage.setItem("radar_training_progress_v1", JSON.stringify({
      completedPhases: ["fase1", "fase2", "fase3", "fase4", "fase5", "fase6"],
      ethicalChecks: ["e1", "e2", "e3", "e4", "e5"],
      finished: false,
      officialChecklist: ["c1", "c2"],
      version: 1,
    }));
  });

  await page.reload();
  await expect(page.getByRole("button", { name: "Concluir Treinamento" })).toBeDisabled();
  await expect(page.getByText(/A liberacao final exige simulador pratico/i)).toBeVisible();
  await expect(page.getByText("Jogue o simulador", { exact: true })).toBeVisible();
  await expect(page.getByText("2/5 itens", { exact: true })).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("radar_training_progress_v1", JSON.stringify({
      completedPhases: ["fase1", "fase2", "fase3", "fase4", "fase5", "fase6"],
      ethicalChecks: ["e1", "e2", "e3", "e4", "e5"],
      finished: false,
      officialChecklist: ["c1", "c2", "c3", "c5"],
      version: 1,
    }));
    localStorage.setItem("radar_training_mini_game_result_v1", JSON.stringify({
      cleanMissions: 3,
      completedAt: "2026-05-21T12:00:00.000Z",
      masteredKinds: ["personalization", "automation", "response", "privacy", "routing"],
      reviewKinds: [],
      totalCorrections: 0,
      version: 1,
    }));
  });

  await page.reload();
  const completionButton = page.getByRole("button", { name: "Concluir Treinamento" });
  await expect(completionButton).toBeEnabled();
  await expect(page.getByText("Pratica registrada", { exact: true })).toBeVisible();
  await expect(page.getByText("5/5 itens", { exact: true })).toBeVisible();
  await completionButton.click();
  await expect(page.getByRole("heading", { name: "Operador Pronto!" })).toBeVisible();
});
