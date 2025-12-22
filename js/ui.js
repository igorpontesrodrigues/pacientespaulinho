/**
 * js/ui.js
 * Funções de manipulação da interface (DOM) e lógica de visualização.
 */

// ============================================================================
// 1. LOGIN E PERMISSÕES
// ============================================================================

function fazerLogin() {
    const senha = document.getElementById('login-senha').value;
    const msg = document.getElementById('login-msg');

    if (senha === 'simone123') {
        currentUserRole = 'ADMIN';
        iniciarSistema('Administrador');
    } else {
        msg.innerText = "Senha incorreta.";
    }
}

function loginVisitante() {
    currentUserRole = 'VISITOR';
    iniciarSistema('Visitante');
}

function iniciarSistema(roleName) {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('user-role-display').innerText = roleName;
    
    // Mostra dashboard inicial
    switchTab('dashboard');
    
    // Aplica permissões visuais
    aplicarPermissoes();
}

function logout() {
    location.reload(); // Recarrega a página para limpar tudo
}

function aplicarPermissoes() {
    const isVisitor = currentUserRole === 'VISITOR';
    
    // 1. Esconde botões de ação na Sidebar (Novo Paciente/Atend)
    const sidebarActions = document.getElementById('sidebar-actions');
    if(sidebarActions) sidebarActions.style.display = isVisitor ? 'none' : 'block';

    // 2. Desabilita/Esconde botões de edição e salvar
    // Usamos CSS classes .btn-action e .btn-delete para controlar em massa
    const botoesAcao = document.querySelectorAll('.btn-action, .btn-delete');
    botoesAcao.forEach(btn => {
        if(isVisitor) btn.classList.add('hidden');
        else {
            // Se for admin, remove hidden, MAS...
            // Para botões de delete, a lógica de mostrar/esconder é controlada pelas funções de abrir formulário
            // Então não removemos cegamente o hidden de .btn-delete aqui, deixamos as funções específicas cuidarem disso
            if(!btn.classList.contains('btn-delete')) {
                btn.classList.remove('hidden');
            }
        }
    });

    // 3. Travar inputs para visitantes
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        // Não trava campos de filtro/busca, apenas formulários
        if(!inp.id.includes('filtro') && !inp.id.includes('busca')) {
            if(isVisitor) inp.setAttribute('disabled', 'true');
            else inp.removeAttribute('disabled');
        }
    });
}

// ============================================================================
// 2. NAVEGAÇÃO
// ============================================================================

function switchTab(tabId) {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const views = [
        'view-lista-pacientes', 'view-lista-atendimentos', 
        'view-form-paciente', 'view-form-atendimento', 
        'view-dashboard', 'view-relatorios', 
        'view-parceiros', 'view-historico-paciente', 
        'view-detalhe-atendimento'
    ];
    
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + tabId);
    if(target) target.classList.remove('hidden');
    
    if (tabId === 'form-paciente') resetFormPaciente();
    if (tabId === 'form-atendimento') resetFormAtendimento();
    
    if (tabId === 'lista-pacientes') {
        const listaVisible = !document.getElementById('subview-pacientes-lista').classList.contains('hidden');
        if(listaVisible && typeof carregarListaPacientes === 'function') carregarListaPacientes();
        else if (typeof carregarAniversarios === 'function') carregarAniversarios();
    }

    if (tabId === 'lista-atendimentos' && typeof carregarListaAtendimentos === 'function') carregarListaAtendimentos();
    if (tabId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    if (tabId === 'parceiros' && typeof initParceiros === 'function') initParceiros();
    if (tabId === 'relatorios' && typeof initRelatorios === 'function') initRelatorios();

    // Reaplicar permissões ao trocar de tela
    if(currentUserRole) aplicarPermissoes();
}

function voltarInicio() { 
    switchTab('lista-pacientes'); 
}

function alternarSubAbaPacientes(aba) {
    const listaDiv = document.getElementById('subview-pacientes-lista');
    const niverDiv = document.getElementById('subview-pacientes-niver');
    const btnLista = document.getElementById('tab-btn-lista');
    const btnNiver = document.getElementById('tab-btn-niver');
    const buscaContainer = document.getElementById('container-busca-pacientes');
    const filtroNiver = document.getElementById('container-filtro-niver');

    if (aba === 'lista') {
        listaDiv.classList.remove('hidden');
        niverDiv.classList.add('hidden');
        buscaContainer.classList.remove('hidden');
        filtroNiver.classList.add('hidden');
        
        btnLista.className = "text-blue-600 border-b-2 border-blue-600 pb-2 transition-all";
        btnNiver.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all flex items-center gap-1";
        
        if(typeof carregarListaPacientes === 'function') carregarListaPacientes();
    } else {
        listaDiv.classList.add('hidden');
        niverDiv.classList.remove('hidden');
        buscaContainer.classList.add('hidden');
        filtroNiver.classList.remove('hidden');
        filtroNiver.style.display = 'flex';

        btnNiver.className = "text-pink-600 border-b-2 border-pink-600 pb-2 transition-all flex items-center gap-1";
        btnLista.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all";

        if(typeof carregarAniversarios === 'function') carregarAniversarios();
    }
}

// ============================================================================
// 3. MODAIS E AÇÕES ESPECÍFICAS
// ============================================================================

function showMessage(msg, type) {
    const el = document.getElementById('system-message');
    el.innerHTML = msg;
    el.className = `mb-4 p-4 rounded-lg border flex items-center gap-2 ${type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`;
    el.classList.remove('hidden');
    if(type !== 'error') setTimeout(() => el.classList.add('hidden'), 5000);
}

function abrirDetalheAtendimento(at) {
    const backdrop = document.getElementById('modal-backdrop-detalhe');
    if(!backdrop) return;
    const innerModal = document.getElementById('view-detalhe-atendimento');
    innerModal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    document.getElementById('det-paciente').innerText = at.nome || '-';
    document.getElementById('det-cpf').innerText = `CPF: ${at.cpf || '-'}`;
    document.getElementById('det-status').innerText = at.status || 'PENDENTE';
    
    const statusEl = document.getElementById('det-status');
    statusEl.className = "px-3 py-1 rounded-full text-xs font-bold border shadow-sm " + 
        (at.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' : 
        (at.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 
        (at.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')));

    document.getElementById('det-data').innerText = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
    document.getElementById('det-tipo').innerText = (at.tipo_servico || '') + (at.tipo ? ` - ${at.tipo}` : '');
    document.getElementById('det-servico').innerText = at.especialidade || '-';
    document.getElementById('det-local').innerText = at.local || '-';
    document.getElementById('det-parceiro').innerText = at.parceiro || '-';
    document.getElementById('det-indicacao').innerText = at.indicacao || '-';
    
    document.getElementById('det-marcacao').innerText = at.data_marcacao ? at.data_marcacao.split('-').reverse().join('/') : '-';
    document.getElementById('det-risco').innerText = at.data_risco ? at.data_risco.split('-').reverse().join('/') : '-';
    document.getElementById('det-obs').innerText = at.obs_atendimento || 'Sem observações.';

    const btnEdit = document.getElementById('btn-editar-detalhe');
    
    if(currentUserRole === 'VISITOR') {
        btnEdit.classList.add('hidden');
    } else {
        btnEdit.classList.remove('hidden');
        btnEdit.onclick = function() {
            fecharDetalhe();
            abrirEdicaoAtendimento(at);
        };
    }
}

function fecharDetalhe() {
    document.getElementById('modal-backdrop-detalhe').classList.add('hidden');
}

function abrirListaRelatorio(tipo, index) {
    if(!window.dadosRelatorioCache || !window.dadosRelatorioCache[tipo]) return;
    const dados = window.dadosRelatorioCache[tipo][index];
    if(!dados) return;

    document.getElementById('modal-lista-relatorio').classList.remove('hidden');
    document.getElementById('titulo-modal-relatorio').innerText = `${dados.nome} (${dados.qtd})`;
    const tbody = document.getElementById('tbody-modal-relatorio');
    tbody.innerHTML = '';

    dados.lista.forEach(at => {
        const tempId = 'rel_item_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 cursor-pointer transition border-b border-slate-50";
        let badgeEspera = "bg-slate-100 text-slate-600";
        if(at.diasEspera > 90) badgeEspera = "bg-red-100 text-red-700";
        else if(at.diasEspera > 30) badgeEspera = "bg-orange-100 text-orange-700";
        else badgeEspera = "bg-green-100 text-green-700";

        tr.innerHTML = `
            <td class="px-6 py-3 font-mono text-xs text-slate-500">${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}</td>
            <td class="px-6 py-3">
                <div class="font-bold text-slate-700 text-sm uppercase">${at.nome}</div>
                <div class="text-xs text-slate-400 flex gap-2"><span>${at.local || 'Local N/I'}</span><span class="text-slate-300">|</span><span>CPF: ${at.cpf || '...'}</span></div>
            </td>
            <td class="px-6 py-3 text-right"><span class="${badgeEspera} px-2 py-1 rounded text-xs font-bold">${at.diasEspera} dias</span></td>
        `;
        tr.onclick = () => {
            document.getElementById('modal-lista-relatorio').classList.add('hidden');
            abrirDetalheAtendimento(window[tempId]);
        };
        tbody.appendChild(tr);
    });
}

// ============================================================================
// 4. IMPRESSÃO DE FICHA EM BRANCO (NOVO)
// ============================================================================

function imprimirFichaEmBranco() {
    const printArea = document.getElementById('printable-area');
    if(!printArea) return;

    // Estilos inline para garantir a formatação na impressão
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleInput = "border-bottom: 1px solid #333; height: 20px; width: 100%; margin-bottom: 10px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";

    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <!-- CABEÇALHO -->
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha de Atendimento</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Gabinete Paulinho Tudo a Ver</p>
            </div>

            <!-- DADOS PESSOAIS -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">1. DADOS DO PACIENTE</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Nome Completo</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CPF</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Nasc.</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">RG</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 1</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 2</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CEP</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Endereço (Rua, Nº, Compl)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Bairro</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Município</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Título Eleitor</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Votação</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>
            </div>

            <!-- DADOS DO SERVIÇO -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">2. DADOS DO SERVIÇO / ATENDIMENTO</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Abertura</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Liderança / Indicação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Tipo Serviço</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Especialidade / Procedimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Atendimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Parceiro / Médico</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Marcação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Valor (R$)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    <span style="${styleLabel}">Observações do Pedido</span>
                    <div style="${styleInput} height: 60px; border: 1px solid #333;"></div>
                </div>
            </div>

            <div style="text-align: center; font-size: 10px; color: #888; margin-top: 20px;">
                Impresso em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão Interna
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

// ============================================================================
// 5. FORMULÁRIOS E PREENCHIMENTO
// ============================================================================

function renderizarSelectsVazios() {
    if(typeof CONFIG_SELECTS === 'undefined') return;
    CONFIG_SELECTS.forEach(cfg => {
        const el = document.getElementById(cfg.container);
        if(el) {
            const fieldName = cfg.nameOverride || cfg.id;
            el.innerHTML = `
                <label class="label-field">${cfg.label}</label>
                <div class="relative">
                    <select id="sel_${cfg.id}" onchange="checkSelectNew('${cfg.id}')" class="input-field bg-white uppercase">
                        <option value="">Carregando...</option>
                    </select>
                    <div id="grp_new_${cfg.id}" class="hidden mt-1 flex gap-1 animate-fade-in">
                        <input type="text" id="inp_${cfg.id}" placeholder="Digite novo..." class="switched-input flex-1 input-field uppercase">
                        <button type="button" onclick="cancelSelectNew('${cfg.id}')" class="bg-red-100 text-red-600 px-3 rounded hover:bg-red-200">✕</button>
                    </div>
                    <input type="hidden" name="${fieldName}" id="field_${cfg.id}">
                </div>`;
        }
    });
}

function checkSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    if (sel.value === '__NEW__') {
        sel.classList.add('hidden');
        document.getElementById(`grp_new_${id}`).classList.remove('hidden');
        document.getElementById(`inp_${id}`).focus();
        document.getElementById(`field_${id}`).value = '';
    } else {
        document.getElementById(`field_${id}`).value = sel.value;
    }
}

function cancelSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    sel.value = ""; 
    document.getElementById(`field_${id}`).value = "";
    sel.classList.remove('hidden'); 
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
}

function preencherSelectInteligente(id, valor) {
    if(!valor) return;
    const sel = document.getElementById(`sel_${id}`);
    const hidden = document.getElementById(`field_${id}`);
    hidden.value = valor;
    sel.classList.remove('hidden');
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
    
    let exists = false;
    for(let i=0; i<sel.options.length; i++) {
        if(sel.options[i].value.toUpperCase() === valor.toUpperCase()) {
            sel.selectedIndex = i;
            exists = true;
            break;
        }
    }
    if(!exists) {
        const novaOpcao = new Option(valor, valor, true, true);
        const lastIndex = sel.options.length - 1;
        if (lastIndex >= 0 && sel.options[lastIndex].value === '__NEW__') {
            sel.add(novaOpcao, sel.options[lastIndex]); 
        } else {
            sel.add(novaOpcao);
        }
        sel.value = valor;
    }
}

function renderizarTabelaPacientes(lista) {
    const tbody = document.getElementById('tabela-pacientes-body');
    tbody.innerHTML = '';
    if(lista.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>'; return; 
    }
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors";
        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');
        
        // Controle de botões por CSS (btn-action) para visitantes
        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800 uppercase" onclick="verHistoricoCompleto(${pStr})">${p.nome}</td>
            <td class="px-6 py-4 text-slate-600" onclick="verHistoricoCompleto(${pStr})">${p.cpf || '<span class="text-orange-500 text-xs font-bold px-2 py-1 bg-orange-100 rounded">SEM CPF</span>'}</td>
            <td class="px-6 py-4 hidden sm:table-cell text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.tel||'-'}</td>
            <td class="px-6 py-4 hidden md:table-cell uppercase text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.municipio||'-'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirAtendimentoDireto('${p.cpf}','${p.id}')" class="btn-action bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-2 hover:bg-emerald-200 transition ${btnEditClass}" title="Novo Atendimento"><i data-lucide="plus" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); abrirEdicaoDireta('${p.cpf}','${p.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition ${btnEditClass}" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderizarTorreGenero(pacientes) {
    let masc = 0, fem = 0;
    pacientes.forEach(p => {
        const s = p.sexo ? p.sexo.toUpperCase() : '';
        if(s === 'M' || s === 'MASCULINO') masc++;
        else if(s === 'F' || s === 'FEMININO') fem++;
    });
    const total = masc + fem || 1;
    const pMasc = Math.round((masc / total) * 100);
    const pFem = Math.round((fem / total) * 100);
    document.getElementById('val-masc').innerText = masc;
    document.getElementById('val-fem').innerText = fem;
    setTimeout(() => {
        const tMasc = document.getElementById('tower-masc');
        const tFem = document.getElementById('tower-fem');
        if(tMasc) tMasc.style.height = `${pMasc}%`;
        if(tFem) tFem.style.height = `${pFem}%`;
    }, 100);
}

function resetFormPaciente() {
    document.getElementById('frmPaciente').reset();
    document.getElementById('paciente_id_hidden').value = "";
    document.getElementById('msg_cpf_paciente').innerText = '';
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    document.getElementById('btn-imprimir').classList.add('hidden');
    
    // Esconde o botão de excluir ao resetar o form (modo novo cadastro)
    const btnDelete = document.getElementById('btn-delete-paciente');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel && cfg.id !== 'status_atendimento') sel.value = "";
        cancelSelectNew(cfg.id);
    });
}

function resetFormAtendimento() {
    document.getElementById('frmAtendimento').reset();
    document.getElementById('atend_id_hidden').value = "";
    document.getElementById('titulo_form_atend').innerText = "Novo Atendimento";
    document.getElementById('txt_btn_atend').innerText = "Confirmar Atendimento";
    document.getElementById('resultado_busca').innerText = '';
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    // Esconde botão excluir no modo novo
    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    document.getElementById('data_abertura').valueAsDate = new Date();
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel) sel.value = "";
        cancelSelectNew(cfg.id);
    });
}

function mostrarFormularioPaciente(isEdit, dados = null) {
    document.getElementById('resto-form-paciente').classList.remove('hidden');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    
    const btnPrint = document.getElementById('btn-imprimir');
    const btnDelete = document.getElementById('btn-delete-paciente');
    
    if(isEdit) {
        btnPrint.classList.remove('hidden');
        // Lógica de visualização do botão de excluir:
        // Só aparece se for edição E usuário for ADMIN
        if(currentUserRole === 'ADMIN') {
            btnDelete.classList.remove('hidden');
        } else {
            btnDelete.classList.add('hidden');
        }
    } else {
        btnPrint.classList.add('hidden');
        btnDelete.classList.add('hidden');
    }

    if(isEdit && dados) {
        document.getElementById('paciente_id_hidden').value = dados.id;
        const fields = ['nome','apelido','familia','rg','nascimento','sexo','tel1','tel2','cep','logradouro','municipio_titulo','zona','secao','obs'];
        fields.forEach(k => { const el = document.getElementById(`field_${k}`); if(el) el.value = dados[k] || ''; });
        ['municipio','bairro','status_titulo'].forEach(k => { preencherSelectInteligente(k, dados[k]); });
        const elSus = document.getElementById('field_sus'); if(elSus) elSus.value = dados.sus || 'SIM';
        const elTitulo = document.getElementById('field_titulo'); if(elTitulo) elTitulo.value = dados.titulo || '';
    }
}

function abrirEdicaoDireta(cpf, id) {
    switchTab('form-paciente');
    const inputCpf = document.getElementById('paciente_cpf_check');
    // FIX: Garante que o CPF seja string para a verificação de length
    const cpfStr = cpf ? String(cpf) : '';
    inputCpf.value = cpfStr;
    
    // Força o carregamento do formulário de edição usando o ID
    // O ID é mais confiável que o CPF para buscar e preencher dados
    if (id) {
        if(typeof verificarPorId === 'function') verificarPorId(id);
    } else if (cpfStr && cpfStr.length > 4) {
        if(typeof verificarCpfInicial === 'function') verificarCpfInicial();
    }
}

function abrirEdicaoAtendimento(at) {
    switchTab('form-atendimento');
    document.getElementById('titulo_form_atend').innerText = "Editar Atendimento";
    document.getElementById('txt_btn_atend').innerText = "Atualizar Dados";
    document.getElementById('atend_id_hidden').value = at.id;
    document.getElementById('busca_cpf').value = at.cpf;
    document.getElementById('hidden_cpf').value = at.cpf;
    document.getElementById('hidden_nome').value = at.nome;
    document.getElementById('resultado_busca').innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="user" class="w-4 h-4"></i> Editando: ${at.nome}</span>`;
    document.getElementById('resto-form-atendimento').classList.remove('hidden');

    // Lógica do botão Excluir Atendimento
    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(currentUserRole === 'ADMIN') {
        btnDelete.classList.remove('hidden');
    } else {
        btnDelete.classList.add('hidden');
    }

    document.getElementById('data_abertura').value = at.data_abertura || '';
    document.getElementById('field_lideranca').value = at.lideranca || ''; 
    document.getElementById('field_tipo').value = at.tipo || ''; 
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    document.getElementById('field_valor').value = at.valor || '';
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';

    ['indicacao','tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => {
        const val = k === 'status_atendimento' ? at.status : at[k];
        preencherSelectInteligente(k, val);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    // REAPLICA PERMISSÕES para garantir que inputs fiquem travados se for visitante
    if(currentUserRole === 'VISITOR') aplicarPermissoes();
}

function abrirEdicaoAtendimentoId(id) {
    const at = todosAtendimentos.find(x => x.id === id);
    if(at) abrirEdicaoAtendimento(at);
}

function abrirAtendimentoDireto(cpf, id) {
    if(!cpf || cpf.length < 5) { alert("Paciente sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
    switchTab('form-atendimento');
    document.getElementById('busca_cpf').value = cpf;
    if(typeof buscarPacienteParaAtendimento === 'function') buscarPacienteParaAtendimento();
}

function calcularDataRisco() {
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const campoEspec = document.getElementById('field_especialidade');
    if(!dataMarcacao) return;
    const d = new Date(dataMarcacao);
    let meses = 3; 
    if(campoEspec && campoEspec.value && campoEspec.value.toUpperCase().includes("OFTALMOLOGIA")) meses = 6;
    d.setMonth(d.getMonth() + meses);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    document.getElementById('field_data_risco').value = `${yyyy}-${mm}-${dd}`;
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (UI HANDLERS)
// ============================================================================

function confirmarExclusaoPaciente() {
    if(!pacienteAtual) return;
    const confirmacao = confirm(`ATENÇÃO: Você está prestes a excluir o paciente ${pacienteAtual.nome}.\n\nISSO APAGARÁ TAMBÉM TODOS OS ATENDIMENTOS DELE.\n\nTem certeza absoluta?`);
    if(confirmacao) {
        if(typeof excluirPacienteAPI === 'function') excluirPacienteAPI(pacienteAtual.id, pacienteAtual.cpf);
    }
}

function confirmarExclusaoAtendimento() {
    const id = document.getElementById('atend_id_hidden').value;
    if(!id) return;
    const confirmacao = confirm("Tem certeza que deseja excluir este atendimento?");
    if(confirmacao) {
        if(typeof excluirAtendimentoAPI === 'function') excluirAtendimentoAPI(id);
    }
}
