
/*
 * BarberHub - JavaScript principal
 * Funcionalidades: cadastro, validação e agendamento.
 *
 * Os dados são armazenados no localStorage.
 */

(() => {
    "use strict";

    const STORAGE_CLIENTES = "barberhub_clientes";
    const STORAGE_AGENDAMENTOS = "barberhub_agendamentos";

    // Recupera dados armazenados no navegador
    const obterDados = (chave) => {
        try {
            return JSON.parse(localStorage.getItem(chave)) || [];
        } catch (erro) {
            console.error(`Erro ao ler ${chave}:`, erro);
            return [];
        }
    };

    // Salva dados no navegador
    const salvarDados = (chave, dados) => {
        localStorage.setItem(chave, JSON.stringify(dados));
    };

    // Remove o que não são números
    const somenteNumeros = (valor) => valor.replace(/\D/g, "");

    // Exibe mensagens de sucesso ou erro
    const mostrarMensagem = (formulario, mensagem, tipo = "sucesso") => {
        let elemento = formulario.querySelector(".mensagem-js");

        if (!elemento) {
            elemento = document.createElement("p");
            elemento.className = "mensagem-js";
            elemento.setAttribute("role", "status");
            elemento.style.marginTop = "16px";
            elemento.style.padding = "12px";
            elemento.style.borderRadius = "7px";
            formulario.appendChild(elemento);
        }

        elemento.textContent = mensagem;
        elemento.style.color =
            tipo === "erro" ? "#ff8b8b" : "#75df9a";

        elemento.style.background =
            tipo === "erro" ? "#3a1d25" : "#173426";
    };

    // Validação do CPF
    const validarCPF = (cpfInformado) => {
        const cpf = somenteNumeros(cpfInformado);

        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        const calcularDigito = (base, pesoInicial) => {
            let soma = 0;

            for (let i = 0; i < base.length; i++) {
                soma += Number(base[i]) * (pesoInicial - i);
            }

            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        };

        const primeiroDigito = calcularDigito(cpf.slice(0, 9), 10);
        const segundoDigito = calcularDigito(cpf.slice(0, 10), 11);

        return primeiroDigito === Number(cpf[9]) &&
            segundoDigito === Number(cpf[10]);
    };

    // CADASTRO DE CLIENTES
    const configurarCadastro = () => {
        const formulario = document.querySelector(
            'form:has(#cpf):has(#confirmar)'
        );

        if (!formulario) return;

        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();

            const nome = formulario.querySelector("#nome").value.trim();
            const cpf = somenteNumeros(
                formulario.querySelector("#cpf").value
            );
            const email = formulario.querySelector("#email")
                .value.trim().toLowerCase();
            const telefone = somenteNumeros(
                formulario.querySelector("#telefone").value
            );
            const nascimento = formulario.querySelector("#nascimento").value;
            const senha = formulario.querySelector("#senha").value;
            const confirmar = formulario.querySelector("#confirmar").value;

            if (!nome || !cpf || !email || !telefone || !senha || !confirmar) {
                mostrarMensagem(
                    formulario,
                    "Preencha todos os campos obrigatórios.",
                    "erro"
                );
                return;
            }

            if (!validarCPF(cpf)) {
                mostrarMensagem(
                    formulario,
                    "CPF inválido. Confira os números digitados.",
                    "erro"
                );
                return;
            }

            if (telefone.length < 10 || telefone.length > 11) {
                mostrarMensagem(
                    formulario,
                    "Informe um telefone com DDD válido.",
                    "erro"
                );
                return;
            }

            if (senha.length < 6) {
                mostrarMensagem(
                    formulario,
                    "A senha deve ter pelo menos 6 caracteres.",
                    "erro"
                );
                return;
            }

            if (senha !== confirmar) {
                mostrarMensagem(
                    formulario,
                    "As senhas não são iguais.",
                    "erro"
                );
                return;
            }

            const clientes = obterDados(STORAGE_CLIENTES);

            if (clientes.some(cliente => cliente.cpf === cpf)) {
                mostrarMensagem(
                    formulario,
                    "Já existe um cadastro com esse CPF.",
                    "erro"
                );
                return;
            }

            if (clientes.some(cliente => cliente.email === email)) {
                mostrarMensagem(
                    formulario,
                    "Este e-mail já está cadastrado.",
                    "erro"
                );
                return;
            }

            // Não armazenamos a senha no localStorage.
            clientes.push({
                nome,
                cpf,
                email,
                telefone,
                nascimento
            });

            salvarDados(STORAGE_CLIENTES, clientes);

            mostrarMensagem(
                formulario,
                "Cadastro realizado com sucesso!"
            );

            formulario.reset();
        });
    };

    // AGENDAMENTO DE HORÁRIOS
    const configurarAgendamento = () => {
        const formulario = document.querySelector(
            'form:has(#barbeiro):has(#horario):has(#data)'
        );

        if (!formulario) return;

        const campoData = formulario.querySelector("#data");

        const hoje = new Date();

        const hojeLocal = [
            hoje.getFullYear(),
            String(hoje.getMonth() + 1).padStart(2, "0"),
            String(hoje.getDate()).padStart(2, "0")
        ].join("-");

        // Impede selecionar datas passadas
        campoData.min = hojeLocal;

        // Recebe serviço escolhido na página de serviços
        const parametros = new URLSearchParams(window.location.search);
        const servicoDaUrl = parametros.get("servico");

        const campoServico = formulario.querySelector("#servico");

        if (servicoDaUrl && campoServico) {
            const opcaoExiste = [...campoServico.options].some(
                opcao => opcao.value === servicoDaUrl
            );

            if (opcaoExiste) {
                campoServico.value = servicoDaUrl;
            }
        }

        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();

            const nome = formulario.querySelector("#nome").value.trim();

            const telefone = somenteNumeros(
                formulario.querySelector("#telefone").value
            );

            const servico = campoServico.value;

            const barbeiro = formulario.querySelector("#barbeiro").value;

            const data = campoData.value;

            const horario = formulario.querySelector("#horario").value;

            const observacao = formulario.querySelector("#observacao")
                .value.trim();

            if (!nome || !telefone || !servico ||
                !barbeiro || !data || !horario) {

                mostrarMensagem(
                    formulario,
                    "Preencha todos os campos obrigatórios.",
                    "erro"
                );

                return;
            }

            if (telefone.length < 10 || telefone.length > 11) {
                mostrarMensagem(
                    formulario,
                    "Informe um telefone com DDD válido.",
                    "erro"
                );
                return;
            }

            if (data < hojeLocal) {
                mostrarMensagem(
                    formulario,
                    "Não é possível agendar em uma data passada.",
                    "erro"
                );
                return;
            }

            const agendamentos = obterDados(STORAGE_AGENDAMENTOS);

            // Verifica se o horário já está ocupado
            const horarioOcupado = agendamentos.some(agendamento =>
                agendamento.data === data &&
                agendamento.horario === horario &&
                agendamento.barbeiro === barbeiro
            );

            if (horarioOcupado) {
                mostrarMensagem(
                    formulario,
                    "Este horário já está ocupado para esse barbeiro. Escolha outro horário.",
                    "erro"
                );

                return;
            }

            // Cria um novo agendamento
            const novoAgendamento = {
                id: (window.crypto && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,
                nome,
                telefone,
                servico,
                barbeiro,
                data,
                horario,
                observacao
            };

            agendamentos.push(novoAgendamento);

            salvarDados(STORAGE_AGENDAMENTOS, agendamentos);

            mostrarMensagem(
                formulario,
                "Agendamento realizado com sucesso!"
            );

            formulario.reset();

            campoData.min = hojeLocal;

            renderizarAgendamentos();
        });

        criarAreaAgendamentos(formulario);
        renderizarAgendamentos();
    };

    // Cria a área de consulta dos agendamentos
    const criarAreaAgendamentos = (formulario) => {
        if (document.querySelector("#lista-agendamentos")) return;

        const area = document.createElement("section");

        area.id = "lista-agendamentos";
        area.style.marginTop = "28px";

        area.innerHTML = `
            <h2 style="margin-bottom: 12px;">
                Agendamentos registrados neste navegador
            </h2>

            <div class="itens-agendamentos"></div>
        `;

        formulario.insertAdjacentElement("afterend", area);
    };

    // Exibe os agendamentos registrados
    const renderizarAgendamentos = () => {
        const lista = document.querySelector(".itens-agendamentos");

        if (!lista) return;

        const agendamentos = obterDados(STORAGE_AGENDAMENTOS);

        if (agendamentos.length === 0) {
            lista.textContent =
                "Nenhum agendamento registrado ainda.";

            return;
        }

        lista.replaceChildren();

        agendamentos
            .slice()
            .sort((a, b) =>
                `${a.data} ${a.horario}`.localeCompare(
                    `${b.data} ${b.horario}`
                )
            )
            .forEach(agendamento => {

                const item = document.createElement("article");

                item.style.padding = "14px";
                item.style.marginBottom = "10px";
                item.style.border = "1px solid #2b3b58";
                item.style.borderRadius = "8px";

                const dataFormatada = new Date(
                    `${agendamento.data}T00:00:00`
                ).toLocaleDateString("pt-BR");

                const servicos = {
                    corte: "Corte de cabelo",
                    barba: "Barba",
                    "corte-barba": "Corte + Barba",
                    sobrancelha: "Sobrancelha",
                    pezinho: "Pezinho"
                };

                const barbeiros = {
                    joao: "João",
                    pedro: "Pedro",
                    carlos: "Carlos"
                };

                const titulo = document.createElement("strong");

                titulo.textContent =
                    `${dataFormatada} às ${agendamento.horario}`;

                const detalhes = document.createElement("p");

                detalhes.textContent =
                    `${agendamento.nome} — ` +
                    `${servicos[agendamento.servico] || agendamento.servico} — ` +
                    `Barbeiro: ${barbeiros[agendamento.barbeiro] || agendamento.barbeiro}`;

                detalhes.style.margin = "8px 0";

                // Botão para cancelar agendamento
                const cancelar = document.createElement("button");

                cancelar.type = "button";
                cancelar.textContent = "Cancelar agendamento";
                cancelar.style.marginTop = "4px";

                cancelar.addEventListener("click", () => {

                    const atualizados = obterDados(STORAGE_AGENDAMENTOS)
                        .filter(itemSalvo =>
                            itemSalvo.id !== agendamento.id
                        );

                    salvarDados(STORAGE_AGENDAMENTOS, atualizados);

                    renderizarAgendamentos();
                });

                item.append(titulo, detalhes, cancelar);

                lista.appendChild(item);
            });
    };

    // Integra os serviços com a página de agendamento
    const configurarLinksDeServico = () => {

        document.querySelectorAll(".servico-card .botao")
            .forEach(link => {

                const titulo = link.closest(".servico-card")
                    ?.querySelector("h3")
                    ?.textContent.trim().toLowerCase();

                const equivalencias = {
                    "corte masculino": "corte",
                    "barba": "barba",
                    "corte + barba": "corte-barba",
                    "sobrancelha": "sobrancelha"
                };

                const servico = equivalencias[titulo];

                if (servico) {
                    link.href =
                        `agendamento.html?servico=${encodeURIComponent(servico)}`;
                }
            });
    };

    // Inicialização do sistema
    document.addEventListener("DOMContentLoaded", () => {

        configurarCadastro();

        configurarAgendamento();

        configurarLinksDeServico();

    });

})();
