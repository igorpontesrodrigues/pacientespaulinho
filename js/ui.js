/**
 * js/ui.js
 * Funções de manipulação da interface (DOM) e lógica de visualização.
 */

// ============================================================================
// VARIÁVEIS GLOBAIS DE UI
// ============================================================================
let listaProcedimentosTemp = []; // Armazena os itens adicionados antes de salvar

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
    
    const sidebarActions = document.getElementById('sidebar-actions');
    if(sidebarActions) sidebarActions.style.display = isVisitor ? 'none' : 'block';

    const botoesAcao = document.querySelectorAll('.btn-action, .btn-delete');
    botoesAcao.forEach(btn => {
        if(isVisitor) btn.classList.add('hidden');
        else {
            if(!btn.classList.contains('btn-delete')) {
                btn.classList.remove('hidden');
            }
        }
    });

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        const id = inp.id || '';
        // CORREÇÃO: Garante que filtros de Dashboard, Relatórios e Parceiros não sejam travados
        const isFilter = id.includes('filtro') || id.includes('busca') || id.includes('dash-filter') || id.includes('rel-filter') || id.includes('parc-filter');
        
        if(!isFilter) {
            if(isVisitor) inp.setAttribute('disabled', 'true');
            else inp.removeAttribute('disabled');
        } else {
            inp.removeAttribute('disabled');
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
        filtroNiver.style.display = 'none'; 

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
// 3. LOGICA DE PROCEDIMENTOS MÚLTIPLOS (NOVO)
// ============================================================================

function adicionarProcedimentoNaLista() {
    // Coleta dados dos inputs do Card
    const dataAbertura = document.getElementById('data_abertura').value;
    const prontuario = document.getElementById('field_prontuario').value;
    const tipoServico = document.getElementById('field_tipo_servico').value;
    const parceiro = document.getElementById('field_parceiro').value;
    const especialidade = document.getElementById('field_especialidade').value;
    const procedimento = document.getElementById('field_procedimento').value;
    const local = document.getElementById('field_local').value;
    const tipoDetalhe = document.getElementById('field_tipo').value;
    const valor = document.getElementById('field_valor').value;
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const dataRisco = document.getElementById('field_data_risco').value;
    const dataConclusao = document.getElementById('field_data_conclusao').value;
    const status = document.getElementById('field_status_atendimento').value; 
    const obs = document.getElementById('field_obs_atendimento').value;

    // Validação mínima
    if (!tipoServico && !procedimento && !especialidade) {
        alert("Preencha pelo menos o Tipo de Serviço, Especialidade ou Procedimento.");
        return;
    }

    // Cria objeto temporário
    const item = {
        tempId: Date.now(), // ID único local
        data_abertura: dataAbertura,
        prontuario: prontuario,
        tipo_servico: tipoServico,
        parceiro: parceiro,
        especialidade: especialidade,
        procedimento: procedimento,
        local: local,
        tipo: tipoDetalhe,
        valor: valor,
        data_marcacao: dataMarcacao,
        data_risco: dataRisco,
        data_conclusao: dataConclusao,
        status: status || (dataConclusao ? 'CONCLUIDO' : 'PENDENTE'),
        obs_atendimento: obs
    };

    listaProcedimentosTemp.push(item);
    renderizarTabelaProcedimentos();
    
    // Limpa campos específicos do card (não limpa data abertura nem prontuário pois podem ser iguais)
    ['field_especialidade', 'field_procedimento', 'field_local', 'field_tipo', 
     'field_valor', 'field_data_marcacao', 'field_data_risco', 'field_data_conclusao', 
     'field_obs_atendimento'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    
    // Reseta selects (exceto os que podem repetir)
    ['especialidade', 'procedimento', 'local', 'tipo'].forEach(k => {
        const sel = document.getElementById(`sel_${k}`);
        if(sel) sel.value = "";
        cancelSelectNew(k);
    });
}

function renderizarTabelaProcedimentos() {
    const tbody = document.getElementById('lista-procedimentos-temp');
    tbody.innerHTML = '';

    if (listaProcedimentosTemp.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400 italic">Nenhum item adicionado.</td></tr>';
        return;
    }

    listaProcedimentosTemp.forEach((item, index) => {
        const tr = document.createElement('tr');
        const dataFmt = item.data_marcacao ? item.data_marcacao.split('-').reverse().join('/') : (item.data_abertura ? item.data_abertura.split('-').reverse().join('/') : '-');
        const desc = `${item.tipo_servico || ''} ${item.especialidade || ''} ${item.procedimento || ''}`.trim();
        
        let statusColor = item.status === 'CONCLUIDO' ? 'text-emerald-600' : 'text-orange-600';

        tr.innerHTML = `
            <td class="px-4 py-2 font-mono text-xs">${dataFmt}</td>
            <td class="px-4 py-2 uppercase text-xs font-bold text-slate-700">${desc}</td>
            <td class="px-4 py-2 uppercase text-xs">${item.local || '-'}</td>
            <td class="px-4 py-2 text-xs font-bold ${statusColor}">${item.status}</td>
            <td class="px-4 py-2 text-right">
                <button type="button" onclick="removerItemTemp(${index})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function removerItemTemp(index) {
    listaProcedimentosTemp.splice(index, 1);
    renderizarTabelaProcedimentos();
}

// Automação: Data Conclusão -> Status
function checkStatusConclusao() {
    const dataConc = document.getElementById('field_data_conclusao').value;
    const selStatus = document.getElementById('sel_status_atendimento');
    const fieldStatus = document.getElementById('field_status_atendimento');
    
    if (dataConc) {
        if(selStatus) selStatus.value = 'CONCLUIDO';
        if(fieldStatus) fieldStatus.value = 'CONCLUIDO';
    } else {
        // Se limpar, volta pra pendente (padrão)
        if(selStatus && selStatus.value === 'CONCLUIDO') {
            selStatus.value = 'PENDENTE';
            if(fieldStatus) fieldStatus.value = 'PENDENTE';
        }
    }
}

// ============================================================================
// 4. ATENDIMENTOS E FILTROS (ATUALIZADO)
// ============================================================================

async function carregarListaAtendimentos() {
    const tbody = document.getElementById('tabela-atendimentos-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Buscando...</td></tr>';
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getServicesList`);
        const json = await res.json();
        todosAtendimentos = json.data; // Cache global
        if(typeof atualizarFiltrosData === 'function') atualizarFiltrosData();
        if(typeof filtrarAtendimentos === 'function') filtrarAtendimentos();
    } catch(e) { if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro.</td></tr>'; }
}

function atualizarFiltrosData() {
    const anos = new Set();
    const meses = new Set();
    todosAtendimentos.forEach(at => {
        if(at.data_abertura) {
            const [y, m] = at.data_abertura.split('-');
            if(y) anos.add(y); if(m) meses.add(m);
        }
    });
    let htmlAno = '<option value="">Todos Anos</option>';
    Array.from(anos).sort().reverse().forEach(a => htmlAno += `<option value="${a}">${a}</option>`);
    document.getElementById('filtro-ano').innerHTML = htmlAno;

    const nomesMeses = {"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
    let htmlMes = '<option value="">Todos Meses</option>';
    Array.from(meses).sort().forEach(m => { if(nomesMeses[m]) htmlMes += `<option value="${m}">${m} - ${nomesMeses[m]}</option>`; });
    document.getElementById('filtro-mes').innerHTML = htmlMes;
}

function filtrarAtendimentos() {
    const mes = document.getElementById('filtro-mes').value;
    const ano = document.getElementById('filtro-ano').value;
    const status = document.getElementById('filtro-status').value;
    const buscaTexto = document.getElementById('filtro-atendimento-input').value.toLowerCase(); // NOVO FILTRO
    const tbody = document.getElementById('tabela-atendimentos-body');

    const filtrados = todosAtendimentos.filter(at => {
        const [y, m] = at.data_abertura ? at.data_abertura.split('-') : ['',''];
        
        // Filtros Dropdown
        if (mes && m !== mes) return false;
        if (ano && y !== ano) return false;
        if (status && at.status !== status) return false;
        
        // Filtro de Texto (Nome, CPF, Prontuário, Serviço)
        if (buscaTexto) {
            const match = (at.nome || '').toLowerCase().includes(buscaTexto) ||
                          (at.cpf || '').includes(buscaTexto) ||
                          (at.prontuario || '').toLowerCase().includes(buscaTexto) || // Se houver
                          (at.tipo_servico || '').toLowerCase().includes(buscaTexto) ||
                          (at.especialidade || '').toLowerCase().includes(buscaTexto) ||
                          (at.procedimento || '').toLowerCase().includes(buscaTexto);
            if (!match) return false;
        }
        
        return true;
    });

    tbody.innerHTML = '';
    if(filtrados.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum registro.</td></tr>'; return; }
    
    filtrados.forEach(at => {
        let color = at.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' : (at.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : (at.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'));
        
        const tempId = 'at_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-slate-600 text-xs">${at.data_abertura.split('-').reverse().join('/')}</td>
            <td class="px-6 py-4 font-medium text-slate-800 uppercase text-sm">${at.nome}<br><span class="text-slate-400 font-normal text-xs">${at.cpf}</span></td>
            <td class="px-6 py-4 text-slate-600 uppercase text-xs"><span class="font-bold text-slate-700">${at.tipo_servico || '-'}</span><br>${at.local||at.especialidade}</td>
            <td class="px-6 py-4"><span class="${color} px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-black/5">${at.status}</span></td>
            <td class="px-6 py-4 text-right"><button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button></td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    document.getElementById('contador-atendimentos').innerText = `Exibindo ${filtrados.length} registros`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    if(typeof aplicarPermissoes === 'function' && typeof currentUserRole !== 'undefined') aplicarPermissoes();
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
    
    const btnDelete = document.getElementById('btn-delete-paciente');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    // Limpa selects, incluindo os novos (indicação)
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
    document.getElementById('txt_btn_atend').innerText = "Salvar Todos os Atendimentos";
    document.getElementById('resultado_busca').innerText = '';
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    document.getElementById('data_abertura').valueAsDate = new Date();
    
    // Reseta lista temporária
    listaProcedimentosTemp = [];
    renderizarTabelaProcedimentos();

    // Adiciona listener para automação de data conclusão (garantia)
    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) {
        inpConclusao.onchange = checkStatusConclusao;
    }
    
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
        
        // Mapeamento dos campos (incluindo novos)
        const fields = [
            'nome','apelido','familia','rg','nascimento','sexo','tel1','tel2',
            'cep','logradouro','municipio_titulo','zona','secao','obs',
            'sus', 'referencia', 'lideranca' // Novos campos diretos
        ];
        
        fields.forEach(k => { const el = document.getElementById(`field_${k}`); if(el) el.value = dados[k] || ''; });
        
        // Selects inteligentes
        ['municipio','bairro','status_titulo', 'indicacao'].forEach(k => { 
            preencherSelectInteligente(k, dados[k]); 
        });
        
        const elTitulo = document.getElementById('field_titulo'); if(elTitulo) elTitulo.value = dados.titulo || '';
    }
}

function abrirEdicaoDireta(cpf, id) {
    switchTab('form-paciente');
    const inputCpf = document.getElementById('paciente_cpf_check');
    const cpfStr = cpf ? String(cpf) : '';
    inputCpf.value = cpfStr;
    
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

    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(currentUserRole === 'ADMIN') {
        btnDelete.classList.remove('hidden');
    } else {
        btnDelete.classList.add('hidden');
    }

    // Preenche campos do card
    document.getElementById('data_abertura').value = at.data_abertura || '';
    document.getElementById('field_prontuario').value = at.prontuario || '';
    document.getElementById('field_tipo').value = at.tipo || ''; 
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    document.getElementById('field_data_conclusao').value = at.data_conclusao || '';
    document.getElementById('field_valor').value = at.valor || '';
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';

    // Atenção: indicação e liderança foram movidos para o Paciente, então não preenchemos aqui
    ['tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => {
        const val = k === 'status_atendimento' ? at.status : at[k];
        preencherSelectInteligente(k, val);
    });
    
    // Adiciona listener para automação de data conclusão (garantia)
    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) inpConclusao.onchange = checkStatusConclusao;
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(currentUserRole === 'VISITOR') aplicarPermissoes();
}

function abrirEdicaoAtendimentoId(id) {
    const at = todosAtendimentos.find(x => x.id === id);
    if(at) abrirEdicaoAtendimento(at);
}

function abrirAtendimentoDireto(cpf, id) {
    if(!cpf || cpf.length < 5) { alert("Eleitor sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
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
    const confirmacao = confirm(`ATENÇÃO: Você está prestes a excluir o eleitor ${pacienteAtual.nome}.\n\nISSO APAGARÁ TAMBÉM TODOS OS ATENDIMENTOS DELE.\n\nTem certeza absoluta?`);
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

// ============================================================================
// 7. RELATÓRIO ELEITORAL (NOVO)
// ============================================================================

function abrirRelatorioEleitoral() {
    // Verifica se os dados do dashboard já foram carregados
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Dados do dashboard ainda não carregados. Aguarde um momento.");
        return;
    }

    const modal = document.getElementById('modal-relatorio-eleitoral');
    modal.classList.remove('hidden');

    // Popula o select de filtro com os status existentes
    const statusSet = new Set();
    dashboardRawData.pacientes.forEach(p => {
        // Trata vazio/null como "N/I" e garante que "N/I" sempre entre na lista
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        statusSet.add(st);
    });
    
    const sel = document.getElementById('filtro-modal-eleitoral');
    sel.innerHTML = '<option value="">Todos os Status</option>';
    Array.from(statusSet).sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    filtrarRelatorioEleitoral();
}

function filtrarRelatorioEleitoral() {
    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    const tbody = document.getElementById('tbody-relatorio-eleitoral');
    const theadTr = document.querySelector('#modal-relatorio-eleitoral thead tr');
    
    // Atualiza o cabeçalho para ter a coluna de Ação, caso não tenha (prevenção)
    if(theadTr && theadTr.children.length === 4) {
        const thAcao = document.createElement('th');
        thAcao.className = "px-6 py-3 text-right";
        thAcao.innerText = "Ação";
        theadTr.appendChild(thAcao);
    }

    tbody.innerHTML = '';

    const lista = dashboardRawData.pacientes.filter(p => {
        // Normaliza o status do paciente para N/I se estiver vazio
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        
        // Se houver filtro selecionado, compara exatamente
        if (filtro && st !== filtro) return false;
        
        return true;
    });

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>';
        document.getElementById('contador-eleitoral').innerText = '0 registros';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors";
        
        let statusColor = "bg-slate-100 text-slate-600";
        const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
        if (st.includes('REGULAR')) statusColor = "bg-green-100 text-green-700";
        else if (st.includes('CANCELADO') || st.includes('SUSPENSO')) statusColor = "bg-red-100 text-red-700";
        else if (st.includes('TRANSFERIDO')) statusColor = "bg-orange-100 text-orange-700";

        // Preparar dados para o clique (visualizar histórico)
        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');

        // CONTROLE DO BOTÃO DE EDIÇÃO PARA VISITANTES
        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';

        tr.innerHTML = `
            <td class="px-6 py-3">
                <div class="font-bold text-slate-800 text-sm uppercase cursor-pointer hover:text-blue-600" onclick="verHistoricoCompleto(${pStr})">${p.nome}</div>
                <div class="text-xs text-slate-400 font-mono">${p.cpf || 'SEM CPF'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${p.tel || '-'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="uppercase text-xs font-bold">${p.bairro || '-'}</div>
                <div class="text-[10px] text-slate-400">Bairro</div>
            </td>
            <td class="px-6 py-3 text-center">
                <span class="${statusColor} px-2 py-1 rounded text-[10px] font-bold uppercase border border-black/5">${st}</span>
            </td>
            <td class="px-6 py-3 text-right">
                <button onclick="document.getElementById('modal-relatorio-eleitoral').classList.add('hidden'); abrirEdicaoDireta('${p.cpf}', '${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded border border-transparent hover:border-blue-200 transition ${btnEditClass}" title="Editar Cadastro">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contador-eleitoral').innerText = `${lista.length} registros encontrados`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// 8. IMPRESSÃO E RELATÓRIOS
// ============================================================================

function imprimirRelatorioEleitoral() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Aguarde o carregamento dos dados.");
        return;
    }

    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    
    const lista = dashboardRawData.pacientes.filter(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        if (filtro && st !== filtro) return false;
        return true;
    });

    const tituloRelatorio = filtro ? `Relatório Eleitoral - Status: ${filtro}` : 'Relatório Eleitoral - Geral';

    let html = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #333;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">${tituloRelatorio}</h1>
                <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Gabinete Família Tudo a Ver | Total: ${lista.length} registros | Emissão: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">NOME / CPF</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">CONTATO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">LOCALIZAÇÃO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc; text-align: center;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (lista.length === 0) {
        html += `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #666;">Nenhum registro encontrado.</td></tr>`;
    } else {
        lista.forEach((p, index) => {
            const bg = index % 2 === 0 ? '#fff' : '#f8fafc';
            const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
            
            html += `
                <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
                    <td style="padding: 6px 5px;">
                        <strong style="text-transform: uppercase;">${p.nome}</strong><br>
                        ${p.cpf || '-'}
                    </td>
                    <td style="padding: 6px 5px;">${p.tel || '-'}</td>
                    <td style="padding: 6px 5px; text-transform: uppercase;">${p.bairro || '-'}</td>
                    <td style="padding: 6px 5px; text-align: center; font-weight: bold;">${st}</td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>
        <div style="margin-top: 20px; font-size: 10px; text-align: right; color: #999;">Sistema de Gestão Interna</div>
    </div>`;

    printArea.innerHTML = html;
    window.print();
}

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
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Gabinete Família Tudo a Ver</p>
            </div>

            <!-- DADOS PESSOAIS -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">1. DADOS DO ELEITOR</h2>
                
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

function abrirDetalheSituacaoEleitoral(label) {
    abrirRelatorioEleitoral(label);
}

function verHistoricoCompleto(p) {
    if(typeof switchTab === 'function') switchTab('historico-paciente');
    
    document.getElementById('hist-nome').innerText = p.nome;
    document.getElementById('hist-cpf').innerText = p.cpf ? `CPF: ${p.cpf}` : 'SEM CPF REGISTRADO';
    document.getElementById('hist-tel').innerText = `Tel: ${p.tel || '-'}`;
    
    const divDetalhes = document.getElementById('hist-detalhes');
    divDetalhes.innerHTML = '<div class="col-span-3 text-center text-blue-500"><i class="animate-spin inline-block mr-2" data-lucide="loader-2"></i> Carregando dados completos...</div>';
    
    const timeline = document.getElementById('hist-timeline');
    timeline.innerHTML = '<p class="text-slate-400 text-sm italic pl-4">Buscando histórico completo...</p>';

    const btnHistDelete = document.getElementById('btn-hist-delete');
    if(btnHistDelete && typeof currentUserRole !== 'undefined') {
        btnHistDelete.classList.toggle('hidden', currentUserRole !== 'ADMIN');
    }

    try {
        // Usa o ID se disponível, senão CPF
        let buscaParam = p.id ? `&busca=${p.id}&tipo=id` : `&busca=${p.cpf}&tipo=cpf`;
        fetch(`${SCRIPT_URL}?action=findPatient${buscaParam}`)
            .then(res => res.json())
            .then(jsonPac => {
                let pacienteCompleto = p;
                if(jsonPac.found) {
                    pacienteCompleto = jsonPac;
                    pacienteAtual = jsonPac; 
                    histPacienteAtual = jsonPac;
                } else {
                    pacienteAtual = p;
                    histPacienteAtual = p;
                }

                divDetalhes.innerHTML = `
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Data Nasc.</span> <span class="font-medium text-slate-800">${pacienteCompleto.nascimento ? pacienteCompleto.nascimento.split('-').reverse().join('/') : '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">RG</span> <span class="font-medium text-slate-800">${pacienteCompleto.rg || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Município</span> <span class="font-medium text-slate-800">${pacienteCompleto.municipio || '-'}</span></div>
                    
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Bairro</span> <span class="font-medium text-slate-800">${pacienteCompleto.bairro || '-'}</span></div>
                    <div class="md:col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Endereço</span> <span class="font-medium text-slate-800">${pacienteCompleto.logradouro || '-'}</span></div>
                    
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Título Eleitor</span> <span class="font-medium text-slate-800">${pacienteCompleto.titulo || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Zona/Seção</span> <span class="font-medium text-slate-800">${pacienteCompleto.zona || '-'}/${pacienteCompleto.secao || '-'}</span></div>
                    <div><span class="block text-xs font-bold text-slate-400 uppercase">Família</span> <span class="font-medium text-slate-800">${pacienteCompleto.familia || '-'}</span></div>
                    
                    ${pacienteCompleto.obs ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Observações</span> <p class="italic text-slate-600">${pacienteCompleto.obs}</p></div>` : ''}
                `;

                fetch(`${SCRIPT_URL}?action=getPatientHistory&cpf=${pacienteCompleto.cpf || ''}&nome=${encodeURIComponent(pacienteCompleto.nome)}`)
                    .then(res => res.json())
                    .then(jsonHist => {
                        const history = jsonHist.data || [];

                        if(history.length === 0) {
                            timeline.innerHTML = '<p class="text-slate-400 pl-4">Nenhum atendimento registrado.</p>';
                        } else {
                            const itemsHtml = history.map(at => {
                                const dataFmt = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
                                let statusColor = "bg-slate-100 text-slate-600";
                                if(at.status === 'CONCLUIDO') statusColor = "bg-emerald-100 text-emerald-700";
                                if(at.status === 'PENDENTE') statusColor = "bg-amber-100 text-amber-700";
                                if(at.status === 'CANCELADO') statusColor = "bg-red-100 text-red-700";

                                const tempId = 'hist_' + Math.random().toString(36).substr(2, 9);
                                window[tempId] = at;

                                return `
                                    <div class="relative pl-4 pb-6 cursor-pointer hover:opacity-80 transition" onclick="abrirDetalheAtendimento(window['${tempId}'])">
                                        <div class="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-100"></div>
                                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                            <div class="flex justify-between items-start mb-2">
                                                <span class="font-bold text-slate-800">${dataFmt}</span>
                                                <span class="${statusColor} text-[10px] px-2 py-0.5 rounded font-bold uppercase">${at.status}</span>
                                            </div>
                                            <div class="text-sm text-slate-700">
                                                <span class="font-bold">${at.tipo_servico || 'SERVIÇO'}</span> 
                                                <span class="text-slate-400 mx-1">•</span> 
                                                ${at.especialidade || at.local || 'Geral'}
                                            </div>
                                            <div class="text-xs text-slate-500 mt-2 flex justify-between items-center">
                                                <span>Clique para ver detalhes</span>
                                                <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                            timeline.innerHTML = itemsHtml;
                        }
                        
                        if(typeof lucide !== 'undefined') lucide.createIcons();
                    });
            });

    } catch(e) {
        divDetalhes.innerHTML = '<div class="col-span-3 text-red-500">Erro ao carregar detalhes do paciente.</div>';
        timeline.innerHTML = '<p class="text-red-500 pl-4">Erro ao carregar histórico.</p>';
        console.error(e);
    }
}

async function imprimirFicha() {
    if(!pacienteAtual) { alert("Busque um eleitor para imprimir."); return; }
    
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Gerando impressão...");
    
    if (loading) {
        loading.classList.remove('hidden'); loading.classList.add('flex');
    } else {
        document.body.style.cursor = 'wait';
    }

    try {
        const res = await fetch(`${SCRIPT_URL}?action=getPatientHistory&cpf=${pacienteAtual.cpf || ''}&nome=${encodeURIComponent(pacienteAtual.nome)}`);
        const json = await res.json();
        const history = json.data || [];

        let html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 100%;">
                
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="text-align: left;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase;">Ficha de Acompanhamento</h1>
                        <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Gabinete Família Tudo a Ver</p>
                    </div>
                    <div style="text-align: right; font-size: 10px; color: #777;">
                        Emissão: ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>

                <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 20px; font-size: 12px;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 5px;">
                        <div><strong>NOME:</strong> ${pacienteAtual.nome}</div>
                        <div><strong>CPF:</strong> ${pacienteAtual.cpf || '-'}</div>
                        <div><strong>RG:</strong> ${pacienteAtual.rg || '-'}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                        <div><strong>DATA NASC.:</strong> ${pacienteAtual.nascimento ? pacienteAtual.nascimento.split('-').reverse().join('/') : '-'}</div>
                        <div><strong>TEL:</strong> ${pacienteAtual.tel1 || '-'}</div>
                        <div><strong>BAIRRO:</strong> ${pacienteAtual.bairro || '-'}</div>
                        <div><strong>TÍTULO:</strong> ${pacienteAtual.titulo || '-'}</div>
                    </div>
                    ${pacienteAtual.obs ? `
                    <div style="margin-top: 8px; pt: 5px; border-top: 1px dashed #cbd5e1;">
                        <strong>OBSERVAÇÕES:</strong> <span style="font-style: italic;">${pacienteAtual.obs}</span>
                    </div>` : ''}
                </div>

                <h3 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px; text-transform: uppercase;">
                    Histórico de Atendimentos (${history.length})
                </h3>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #e2e8f0; text-align: left;">
                            <th style="padding: 6px; border: 1px solid #cbd5e1; width: 80px;">DATA</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1;">TIPO / ESPECIALIDADE</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1;">LOCAL / PROCEDIMENTO</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1;">DETALHES / PARCEIRO</th>
                            <th style="padding: 6px; border: 1px solid #cbd5e1; width: 80px; text-align: center;">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if(history.length === 0) {
            html += `<tr><td colspan="5" style="padding: 15px; text-align: center; border: 1px solid #cbd5e1; font-style: italic; color: #666;">Nenhum atendimento registrado.</td></tr>`;
        } else {
            history.forEach((at, index) => {
                const bg = index % 2 === 0 ? '#fff' : '#f8fafc';
                let statusStyle = "font-weight: bold;";
                if(at.status === 'PENDENTE') statusStyle += "color: #d97706;";
                else if(at.status === 'CANCELADO') statusStyle += "color: #dc2626;";
                else statusStyle += "color: #059669;";

                html += `
                    <tr style="background-color: ${bg};">
                        <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top;">
                            ${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top;">
                            <strong>${at.tipo_servico || '-'}</strong><br>
                            ${at.especialidade || ''}
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top;">
                            ${at.local || '-'}<br>
                            ${at.procedimento || ''}
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top;">
                            ${at.parceiro ? `Parc: ${at.parceiro}<br>` : ''}
                            ${at.obs_atendimento || ''}
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; vertical-align: top;">
                            <span style="${statusStyle}">${at.status}</span>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div>`;

        const printArea = document.getElementById('printable-area');
        if (printArea) {
            printArea.innerHTML = html;
            window.print();
        }

        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        document.body.style.cursor = 'default';

    } catch(e) { 
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        document.body.style.cursor = 'default';
        alert("Erro ao gerar impressão: " + e); 
    }
}
