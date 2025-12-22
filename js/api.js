/**
 * js/api.js
 * Funções de comunicação com o backend (Apps Script) e lógica de negócios.
 */

// ============================================================================
// 1. FUNÇÕES BASE (FETCH E DEBUG)
// ============================================================================

async function sendData(action, data, loadingId) {
    const loading = document.getElementById(loadingId);
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
    
    // Converte strings para uppercase, exceto IDs e CPFs e datas
    for(let k in data) {
        if(typeof data[k] === 'string' && !['cpf','id'].includes(k) && !k.includes('data')) {
            data[k] = data[k].toUpperCase();
        }
    }

    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: action, data: data }) 
        });
        const json = await res.json();
        
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        
        if(json.status === 'success') { 
            showMessage(json.message, 'success'); 
            return true; 
        } else { 
            alert(json.message); 
            return false; 
        }
    } catch(e) { 
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro de conexão: " + e); 
        return false; 
    }
}

async function verificarDebug() {
    showMessage("Testando conexão...", "info");
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFilters`);
        const result = await response.json();
        if (result.status === 'success') {
            const keys = Object.keys(result.data);
            showMessage(`<b>Sucesso!</b> Chaves: ${keys.join(', ')}`, 'success');
        } else showMessage(`<b>Erro:</b> ${result.message}`, 'error');
    } catch (err) { showMessage(`<b>Erro Crítico:</b> ${err}`, 'error'); }
}

async function carregarFiltros() {
    const safety = setTimeout(() => {
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(sel && sel.value === "" && sel.options[0].text === "Carregando...") {
                    sel.innerHTML = '<option value="">(Sem dados)</option><option value="__NEW__" class="text-blue-600 font-bold">+ Cadastrar Novo</option>';
                }
            });
        }
    }, 3000);

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFilters`);
        const result = await response.json();
        clearTimeout(safety);

        if (result.status === 'success') {
            opcoesFiltros = result.data; // Cache global
            
            if(typeof CONFIG_SELECTS !== 'undefined') {
                CONFIG_SELECTS.forEach(cfg => {
                    const lista = opcoesFiltros[cfg.key];
                    const sel = document.getElementById(`sel_${cfg.id}`);
                    if(!sel) return;

                    sel.innerHTML = '<option value="">Selecione...</option>';
                    if(lista && Array.isArray(lista) && lista.length > 0) {
                        [...new Set(lista)].sort().forEach(op => sel.innerHTML += `<option value="${op}">${op}</option>`);
                    }
                    sel.innerHTML += '<option value="__NEW__" class="font-bold text-blue-600 border-t">+ Cadastrar Novo</option>';
                    
                    const hiddenVal = document.getElementById(`field_${cfg.id}`).value;
                    if(hiddenVal) {
                        let exists = false;
                        for(let i=0; i<sel.options.length; i++) {
                            if(sel.options[i].value.toUpperCase() === hiddenVal.toUpperCase()) {
                                sel.selectedIndex = i;
                                exists = true;
                                break;
                            }
                        }
                        if(!exists) {
                            const novaOpcao = new Option(hiddenVal, hiddenVal, true, true);
                            const lastIndex = sel.options.length - 1;
                            if (lastIndex >= 0 && sel.options[lastIndex].value === '__NEW__') {
                                sel.add(novaOpcao, sel.options[lastIndex]); 
                            } else {
                                sel.add(novaOpcao);
                            }
                            sel.value = hiddenVal; 
                        }
                    }
                });
            }
        }
    } catch (err) { console.error(err); }
}

// ============================================================================
// 2. PACIENTES E HISTÓRICO
// ============================================================================

async function carregarListaPacientes() {
    const tbody = document.getElementById('tabela-pacientes-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>';
    
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getPatientsList`);
        const json = await res.json();
        todosPacientes = json.data; // Cache global
        if(typeof renderizarTabelaPacientes === 'function') renderizarTabelaPacientes(todosPacientes);
    } catch(e) { 
        if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro de conexão.</td></tr>'; 
    }
}

function filtrarPacientesNaTela() {
    const termo = document.getElementById('filtro-paciente-input').value.toLowerCase();
    const filtrados = todosPacientes.filter(p => {
        const nome = p.nome ? String(p.nome).toLowerCase() : '';
        const cpf = p.cpf ? String(p.cpf) : '';
        const municipio = p.municipio ? String(p.municipio).toLowerCase() : '';
        return nome.includes(termo) || cpf.includes(termo) || municipio.includes(termo);
    });
    if(typeof renderizarTabelaPacientes === 'function') renderizarTabelaPacientes(filtrados);
}

async function carregarAniversarios() {
    const tbody = document.getElementById('tabela-niver-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Buscando...</td></tr>';
    const mes = parseInt(document.getElementById('filtro-niver-mes').value);
    
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getBirthdays&mes=${mes}`);
        const json = await res.json();
        tbody.innerHTML = '';
        if(json.data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum aniversariante neste mês.</td></tr>'; return; }
        
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const mesHoje = hoje.getMonth() + 1;

        json.data.forEach(p => {
            if(p.data_completa && p.data_completa.startsWith('1900')) return;

            let statusClass = "text-slate-600";
            let rowClass = "hover:bg-blue-50 cursor-pointer transition-all border-b border-slate-100";
            let statusText = "Futuro";
            let icone = "";

            if (mes < mesHoje) {
                statusClass = "text-slate-500";
                rowClass = "bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200 transition-colors";
                statusText = "Já foi";
                icone = "check";
            } else if (mes > mesHoje) {
                statusClass = "text-blue-600 font-medium";
                rowClass = "bg-white hover:bg-blue-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-blue-300 transition-colors";
                statusText = "Futuro";
                icone = "calendar-clock";
            } else {
                if (p.dia < diaHoje) {
                    statusClass = "text-slate-500 font-medium";
                    rowClass = "bg-slate-100 hover:bg-slate-200 cursor-pointer border-b border-slate-200 transition-colors";
                    statusText = "Já foi";
                    icone = "check-circle";
                } else if (p.dia === diaHoje) {
                    statusClass = "text-emerald-700 font-bold animate-pulse";
                    rowClass = "bg-emerald-50 border-2 border-emerald-400 cursor-pointer shadow-md relative z-10";
                    statusText = "HOJE!";
                    icone = "party-popper";
                } else {
                    statusClass = "text-slate-600 font-bold";
                    rowClass = "bg-white hover:bg-slate-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-slate-300 transition-colors";
                    statusText = "Em breve";
                    icone = "clock";
                }
            }

            let dataFmt = `${p.dia}/${mes}`;
            if(p.data_completa) {
                const parts = p.data_completa.split('-');
                if(parts.length === 3) {
                    const ano = parseInt(parts[0]);
                    if(ano > 1901) dataFmt = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    else dataFmt = `${parts[2]}/${parts[1]}`; 
                }
            }

            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.onclick = function() { 
                if(p.cpf || p.nome) verHistoricoCompleto(p);
                else alert("Cadastro incompleto (sem CPF/Nome).");
            };
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold ${statusClass} flex items-center gap-2">
                    ${icone ? `<i data-lucide="${icone}" class="w-4 h-4"></i>` : ''} ${dataFmt}
                </td>
                <td class="px-6 py-4 uppercase font-medium text-slate-700">${p.nome}</td>
                <td class="px-6 py-4 text-slate-500">${p.tel||'-'}</td>
                <td class="px-6 py-4 text-slate-500 uppercase">${p.bairro||'-'}</td>
                <td class="px-6 py-4 text-xs uppercase font-bold ${statusClass}">${statusText}</td>
            `;
            tbody.appendChild(tr);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro ao carregar.</td></tr>'; }
}

async function verHistoricoCompleto(p) {
    histPacienteAtual = p;
    
    // SwitchTab está em ui.js
    if(typeof switchTab === 'function') switchTab('historico-paciente');
    
    document.getElementById('hist-nome').innerText = p.nome;
    document.getElementById('hist-cpf').innerText = p.cpf ? `CPF: ${p.cpf}` : 'SEM CPF REGISTRADO';
    document.getElementById('hist-tel').innerText = `Tel: ${p.tel || '-'}`;
    
    const timeline = document.getElementById('hist-timeline');
    timeline.innerHTML = '<p class="text-slate-400 text-sm italic pl-4">Buscando histórico completo...</p>';

    try {
        const res = await fetch(`${SCRIPT_URL}?action=getPatientHistory&cpf=${p.cpf || ''}&nome=${encodeURIComponent(p.nome)}`);
        const json = await res.json();
        const history = json.data || [];

        if(history.length === 0) {
            timeline.innerHTML = '<p class="text-slate-400 pl-4">Nenhum atendimento registrado.</p>';
            return;
        }

        const itemsHtml = history.map(at => {
            const dataFmt = at.data_abertura.split('-').reverse().join('/');
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
        if(typeof lucide !== 'undefined') lucide.createIcons();

    } catch(e) {
        timeline.innerHTML = '<p class="text-red-500 pl-4">Erro ao carregar histórico.</p>';
    }
}

async function imprimirFicha() {
    if(!pacienteAtual) { alert("Busque um paciente para imprimir."); return; }
    const loading = document.getElementById('loading-paciente');
    loading.classList.remove('hidden'); loading.classList.add('flex');

    try {
        const res = await fetch(`${SCRIPT_URL}?action=getPatientHistory&cpf=${pacienteAtual.cpf}`);
        const json = await res.json();
        const history = json.data || [];

        let html = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">Ficha de Acompanhamento</h1>
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <p><strong>Nome:</strong> ${pacienteAtual.nome}</p>
                        <p><strong>CPF:</strong> ${pacienteAtual.cpf}</p>
                        <p><strong>RG:</strong> ${pacienteAtual.rg || '-'}</p>
                        <p><strong>Nascimento:</strong> ${pacienteAtual.nascimento ? pacienteAtual.nascimento.split('-').reverse().join('/') : '-'}</p>
                    </div>
                    <div style="flex: 1;">
                        <p><strong>Telefone:</strong> ${pacienteAtual.tel1}</p>
                        <p><strong>Endereço:</strong> ${pacienteAtual.logradouro || ''}, ${pacienteAtual.bairro || ''} - ${pacienteAtual.municipio || ''}</p>
                        <p><strong>Título:</strong> ${pacienteAtual.titulo || '-'} (${pacienteAtual.zona || '-'}/${pacienteAtual.secao || '-'})</p>
                    </div>
                </div>
                <div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; background: #f9f9f9;">
                    <strong>Observações Fixas:</strong><br> ${pacienteAtual.obs || 'Nenhuma.'}
                </div>
                <h2 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Histórico de Atendimentos (${history.length})</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                    <thead>
                        <tr style="background: #eee;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Serviço</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Local/Detalhes</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        if(history.length === 0) html += `<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">Nenhum atendimento registrado.</td></tr>`;
        else history.forEach(at => {
                html += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${at.data_abertura.split('-').reverse().join('/')}</td><td style="border: 1px solid #ddd; padding: 8px;">${at.tipo_servico || '-'} <br><small>${at.especialidade || ''}</small></td><td style="border: 1px solid #ddd; padding: 8px;">${at.local || '-'} <br><small>${at.obs_atendimento || ''}</small></td><td style="border: 1px solid #ddd; padding: 8px;"><b>${at.status}</b></td></tr>`;
            });
        html += `</tbody></table></div>`;
        document.getElementById('printable-area').innerHTML = html;
        loading.classList.add('hidden'); loading.classList.remove('flex');
        window.print();
    } catch(e) { 
        loading.classList.add('hidden'); loading.classList.remove('flex'); 
        alert("Erro ao gerar impressão."); 
    }
}

async function verificarCpfInicial() {
    const cpf = document.getElementById('paciente_cpf_check').value;
    const msg = document.getElementById('msg_cpf_paciente');
    const loading = document.getElementById('loading-paciente');
    
    if(cpf.length < 5) { msg.innerHTML = "<span class='text-red-600 font-bold'>CPF Inválido.</span>"; return; }
    loading.classList.remove('hidden'); loading.classList.add('flex');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    pacienteAtual = null;

    try {
        const res = await fetch(`${SCRIPT_URL}?action=findPatient&busca=${cpf}&tipo=cpf`);
        const json = await res.json();
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(json.found) {
            pacienteAtual = json;
            msg.innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> Encontrado: ${json.nome}</span>`;
            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
        } else {
            msg.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> CPF não encontrado. Iniciando novo cadastro.</span>`;
            if(typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(false);
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { loading.classList.add('hidden'); loading.classList.remove('flex'); msg.innerHTML = "Erro de conexão."; }
}

async function verificarPorId(id) {
    const loading = document.getElementById('loading-paciente');
    loading.classList.remove('hidden'); loading.classList.add('flex');
    try {
        const res = await fetch(`${SCRIPT_URL}?action=findPatient&busca=${id}&tipo=id`);
        const json = await res.json();
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(json.found) {
            pacienteAtual = json;
            document.getElementById('msg_cpf_paciente').innerHTML = `<span class="text-orange-600 font-bold flex items-center gap-1"><i data-lucide="alert-circle" class="w-4 h-4"></i> Editando cadastro sem CPF (ID: ${id})</span>`;
            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
            if(typeof editarPaciente === 'function') editarPaciente();
        }
    } catch(e) { console.error(e); }
}

function editarPaciente() { 
    if(pacienteAtual && typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(true, pacienteAtual); 
}

async function submitPaciente(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.cpf = document.getElementById('paciente_cpf_check').value;
    if(!data.cpf || data.cpf.length < 5) { alert("CPF obrigatório."); return; }
    
    if(await sendData('registerPatient', data, 'loading-paciente')) { 
        if(typeof resetFormPaciente === 'function') resetFormPaciente(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    }
}

// ============================================================================
// 3. ATENDIMENTOS E DASHBOARD
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
    const tbody = document.getElementById('tabela-atendimentos-body');

    const filtrados = todosAtendimentos.filter(at => {
        const [y, m] = at.data_abertura ? at.data_abertura.split('-') : ['',''];
        if (mes && m !== mes) return false;
        if (ano && y !== ano) return false;
        if (status && at.status !== status) return false;
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
    
    // Reaplica permissões (esconde botões para visitante)
    if(typeof aplicarPermissoes === 'function' && typeof currentUserRole !== 'undefined') aplicarPermissoes();
}

async function loadDashboard() {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=getAnalyticsData`);
        const json = await res.json();
        if(json.status === 'success') {
            dashboardRawData = json.data; 
            if(typeof popularFiltroAno === 'function') popularFiltroAno();
            if(typeof aplicarFiltrosDashboard === 'function') aplicarFiltrosDashboard();
        }
    } catch(e) { console.error(e); }
}

function popularFiltroAno() {
    if(!dashboardRawData) return;
    const anos = new Set();
    dashboardRawData.atendimentos.forEach(at => {
        if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
    });
    const sel = document.getElementById('dash-filter-ano');
    const current = sel.value;
    sel.innerHTML = '<option value="">Ano: Todos</option>';
    Array.from(anos).sort().reverse().forEach(a => sel.innerHTML += `<option value="${a}">${a}</option>`);
    if(current) sel.value = current;
}

function aplicarFiltrosDashboard() {
    if(!dashboardRawData) return;
    
    const fStatus = document.getElementById('dash-filter-status').value;
    const fMes = document.getElementById('dash-filter-mes').value;
    const fAno = document.getElementById('dash-filter-ano').value;
    
    const temFiltroAtivo = fStatus !== "" || fMes !== "" || fAno !== "";

    const atendimentosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    let pacientesFiltrados;
    if (temFiltroAtivo) {
        const cpfsNosAtendimentos = new Set(atendimentosFiltrados.map(at => at.cpf_paciente));
        pacientesFiltrados = dashboardRawData.pacientes.filter(p => cpfsNosAtendimentos.has(p.cpf));
    } else {
        pacientesFiltrados = dashboardRawData.pacientes;
    }

    const totalPacientes = pacientesFiltrados.length; 
    const totalAtendimentos = atendimentosFiltrados.length;
    const totalPendentes = atendimentosFiltrados.filter(at => at.status === 'PENDENTE').length;

    document.getElementById('dash-pacientes').innerText = totalPacientes;
    document.getElementById('dash-mes').innerText = totalAtendimentos;
    document.getElementById('dash-pendentes').innerText = totalPendentes;

    if(typeof renderizarGraficos === 'function') renderizarGraficos(atendimentosFiltrados, pacientesFiltrados);
    calcularMetricasTempo(atendimentosFiltrados);
    if(typeof renderizarTorreGenero === 'function') renderizarTorreGenero(pacientesFiltrados);
}

function calcularMetricasTempo(atendimentos) {
    const hoje = new Date();
    let totalDiasEspera = 0;
    let countEspera = 0;
    let totalDiasMarcacao = 0;
    let countMarcacao = 0;

    atendimentos.forEach(at => {
        if(!at.data_abertura) return;
        const dAbertura = new Date(at.data_abertura);
        
        if(at.status === 'PENDENTE') {
            const diffTime = Math.abs(hoje - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            totalDiasEspera += diffDays;
            countEspera++;
        } else if (at.data_marcacao) {
            const dMarcacao = new Date(at.data_marcacao);
            const diffTime = Math.abs(dMarcacao - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            totalDiasEspera += diffDays;
            countEspera++;
            totalDiasMarcacao += diffDays;
            countMarcacao++;
        }
    });

    const mediaEspera = countEspera > 0 ? Math.round(totalDiasEspera / countEspera) : 0;
    const mediaMarcacao = countMarcacao > 0 ? Math.round(totalDiasMarcacao / countMarcacao) : 0;

    document.getElementById('dash-tempo-espera').innerText = mediaEspera;
    document.getElementById('dash-tempo-marcacao').innerText = mediaMarcacao;
    document.getElementById('dash-tempo-total').innerText = mediaEspera;
}

async function initParceiros() {
    if(!dashboardRawData) {
        try {
            const res = await fetch(`${SCRIPT_URL}?action=getAnalyticsData`);
            const json = await res.json();
            if(json.status === 'success') dashboardRawData = json.data;
        } catch(e) { console.error(e); return; }
    }

    if(!dashboardRawData) return;

    const selAno = document.getElementById('parc-filter-ano');
    if(selAno.options.length <= 1) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => { if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]); });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    const fStatus = document.getElementById('parc-filter-status').value;
    const fMes = document.getElementById('parc-filter-mes').value;
    const fAno = document.getElementById('parc-filter-ano').value;
    const hoje = new Date();

    const filtrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    if(typeof createChart === 'function' && typeof countByField === 'function') {
        const dadosParceiros = countByField(filtrados, 'parceiro');
        createChart('chartParceirosRanking', 'bar', 
            dadosParceiros.map(d => d[0]), 
            dadosParceiros.map(d => d[1]), 
            { 
                indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }, backgroundColor: '#10b981'
            }
        );
        
        const dadosProc = countByField(filtrados, 'procedimento');
        const topProc = dadosProc.slice(0, 15);
        createChart('chartProcedimentosGeral', 'bar', 
            topProc.map(d => d[0]), topProc.map(d => d[1]), 
            { 
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }, backgroundColor: '#8b5cf6'
            }
        );
    }

    const liderancaStats = {};
    const calcularDiasLocal = (at) => {
        if(!at.data_abertura) return 0;
        const inicio = new Date(at.data_abertura);
        let fim = hoje;
        if(at.data_marcacao) fim = new Date(at.data_marcacao);
        const diffTime = Math.abs(fim - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    filtrados.forEach(at => {
        const lider = at.indicacao ? at.indicacao.trim().toUpperCase() : 'SEM INDICAÇÃO';
        if(!liderancaStats[lider]) {
            liderancaStats[lider] = { nome: lider, total: 0, concluido: 0, pendente: 0, qtd: 0, lista: [] };
        }
        const stat = liderancaStats[lider];
        stat.total++;
        stat.qtd++;
        if(at.status === 'CONCLUIDO') stat.concluido++; else stat.pendente++;
        const dias = calcularDiasLocal(at);
        stat.lista.push({ ...at, id: at.id, cpf: at.cpf_paciente || at.cpf, nome: at.nome_paciente || at.nome || 'Nome não carregado', diasEspera: dias });
    });

    const listaLideranca = Object.values(liderancaStats).sort((a,b) => b.total - a.total);
    window.dadosRelatorioCache['lideranca'] = listaLideranca;

    const tbody = document.getElementById('tabela-lideranca-body');
    tbody.innerHTML = '';
    
    if(listaLideranca.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400 text-xs">Sem dados com estes filtros.</td></tr>';
    } else {
        listaLideranca.forEach((stat, index) => {
            const perc = Math.round((stat.concluido / stat.total) * 100) || 0;
            const corBarra = perc > 70 ? 'bg-emerald-500' : (perc > 40 ? 'bg-blue-500' : 'bg-orange-400');
            
            tbody.innerHTML += `
                <tr class="hover:bg-blue-50 border-b border-slate-50 transition cursor-pointer group" onclick="abrirListaRelatorio('lideranca', ${index})">
                    <td class="px-2 py-2 font-bold text-slate-700 text-xs truncate max-w-[120px] group-hover:text-blue-700" title="${stat.nome}">
                        ${stat.nome} <i data-lucide="search" class="w-3 h-3 inline opacity-0 group-hover:opacity-100 ml-1"></i>
                    </td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-slate-800">${stat.total}</td>
                    <td class="px-2 py-2 text-center font-mono text-emerald-600">${stat.concluido}</td>
                    <td class="px-2 py-2 text-center font-mono text-orange-600">${stat.pendente}</td>
                    <td class="px-2 py-2 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <span class="text-[10px] font-bold text-slate-500">${perc}%</span>
                            <div class="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full ${corBarra}" style="width: ${perc}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

async function initRelatorios() {
    if(!dashboardRawData) {
        try {
            const res = await fetch(`${SCRIPT_URL}?action=getAnalyticsData`);
            const json = await res.json();
            if(json.status === 'success') dashboardRawData = json.data;
        } catch(e) { console.error(e); return; }
    }
    
    const selAno = document.getElementById('rel-filter-ano');
    if(selAno && selAno.options.length <= 1 && dashboardRawData) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => {
            if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
        });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    carregarRelatorioRisco();
    atualizarGraficosRelatorios();
}

function carregarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Calculando...</td></tr>';
    
    if(todosAtendimentos.length === 0) {
        carregarListaAtendimentos().then(() => renderizarRelatorioRisco());
    } else {
        renderizarRelatorioRisco();
    }
}

function renderizarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const listaRisco = todosAtendimentos.filter(at => {
        if(!at.data_risco || at.status === 'CONCLUIDO' || at.status === 'CANCELADO') return false;
        const dRisco = new Date(at.data_risco);
        return dRisco <= trintaDias;
    }).sort((a,b) => new Date(a.data_risco) - new Date(b.data_risco));

    if(listaRisco.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum atendimento em risco próximo.</td></tr>';
        return;
    }

    listaRisco.forEach(at => {
        const dRisco = new Date(at.data_risco);
        const diasRestantes = Math.ceil((dRisco - hoje) / (1000 * 60 * 60 * 24));
        
        let badgeClass = "bg-orange-100 text-orange-700";
        let textoPrazo = `${diasRestantes} dias`;
        
        if(diasRestantes < 0) {
            badgeClass = "bg-red-100 text-red-700 font-bold";
            textoPrazo = `VENCIDO (${Math.abs(diasRestantes)} dias)`;
        } else if(diasRestantes <= 7) {
            badgeClass = "bg-red-50 text-red-600 font-bold";
        }

        const tempId = 'risco_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-red-50 transition-colors cursor-pointer";
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-slate-800">
                ${at.data_risco.split('-').reverse().join('/')}
                <div class="text-xs ${badgeClass} inline-block px-2 py-0.5 rounded mt-1">${textoPrazo}</div>
            </td>
            <td class="px-6 py-4 text-slate-700 uppercase text-xs font-bold">${at.nome}</td>
            <td class="px-6 py-4 text-slate-600 text-xs uppercase">${at.procedimento || at.tipo_servico}<br>${at.local || ''}</td>
            <td class="px-6 py-4 text-xs font-bold text-slate-500">${at.status}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(typeof aplicarPermissoes === 'function' && typeof currentUserRole !== 'undefined') aplicarPermissoes();
}

function atualizarGraficosRelatorios() {
    if(!dashboardRawData) return;

    const fStatus = document.getElementById('rel-filter-status').value;
    const fMes = document.getElementById('rel-filter-mes').value;
    const fAno = document.getElementById('rel-filter-ano').value;
    const hoje = new Date();

    const dadosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    const calcularDias = (at) => {
        if(!at.data_abertura) return 0;
        const inicio = new Date(at.data_abertura);
        let fim = hoje; 
        if(at.data_marcacao) {
            fim = new Date(at.data_marcacao);
        } else if (at.status === 'CONCLUIDO') {
            return null; 
        }
        const diffTime = Math.abs(fim - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const processarMedia = (campo) => {
        const grupos = {};
        dadosFiltrados.forEach(at => {
            const chave = at[campo] ? at[campo].trim().toUpperCase() : 'N/I';
            const dias = calcularDias(at);
            if(dias !== null) {
                if(!grupos[chave]) grupos[chave] = { total: 0, qtd: 0, lista: [] };
                grupos[chave].total += dias;
                grupos[chave].qtd++;
                const atNormalizado = { ...at, id: at.id, cpf: at.cpf_paciente, nome: at.nome_paciente || 'Nome não carregado', diasEspera: dias };
                grupos[chave].lista.push(atNormalizado);
            }
        });
        return Object.entries(grupos)
            .map(([nome, dados]) => ({ 
                nome, mediaDias: Math.round(dados.total / dados.qtd), qtd: dados.qtd, lista: dados.lista.sort((a,b) => b.diasEspera - a.diasEspera) 
            }))
            .sort((a,b) => b.mediaDias - a.mediaDias) 
            .slice(0, 10); 
    };

    const dadosEspecialidade = processarMedia('especialidade');
    const dadosProcedimento = processarMedia('procedimento');

    window.dadosRelatorioCache['especialidade'] = dadosEspecialidade;
    window.dadosRelatorioCache['procedimento'] = dadosProcedimento;

    renderizarTabelaGrafica('listaRelEspecialidade', dadosEspecialidade, 'bg-rose-500', 'especialidade');
    renderizarTabelaGrafica('listaRelProcedimento', dadosProcedimento, 'bg-violet-500', 'procedimento');
}

function renderizarTabelaGrafica(containerId, dados, corBarra, tipo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if(dados.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm italic text-center py-4">Sem dados para o período.</p>';
        return;
    }

    const maxDias = Math.max(...dados.map(d => d.mediaDias)) || 1;

    dados.forEach((d, index) => {
        const porcentagem = (d.mediaDias / maxDias) * 100;
        const meses = (d.mediaDias / 30).toFixed(1); 
        
        const html = `
            <div class="group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition" onclick="abrirListaRelatorio('${tipo}', ${index})">
                <div class="flex justify-between text-xs mb-1 text-slate-700">
                    <span class="font-bold truncate pr-2 w-1/2 flex items-center gap-1 group-hover:text-blue-600 transition">
                        ${d.nome} <i data-lucide="chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition"></i>
                    </span>
                    <span class="text-slate-500 font-mono bg-white px-1 rounded border border-slate-100">${d.qtd} atd.</span>
                </div>
                <div class="flex items-center gap-2 h-6" title="Média exata: ${d.mediaDias} dias">
                    <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full ${corBarra} opacity-80 group-hover:opacity-100 transition-all" style="width: ${porcentagem}%"></div>
                    </div>
                    <span class="text-xs font-bold text-slate-600 w-16 text-right">${meses} meses</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

async function buscarPacienteParaAtendimento() {
    const termo = document.getElementById('busca_cpf').value;
    const resDiv = document.getElementById('resultado_busca');
    if(termo.length < 3) return; 
    
    resDiv.innerText = "Buscando..."; 
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    try {
        const res = await fetch(`${SCRIPT_URL}?action=findPatient&busca=${encodeURIComponent(termo)}&tipo=cpf`);
        const json = await res.json();
        if(json.found) {
            resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${json.nome}</span>`;
            document.getElementById('hidden_cpf').value = json.cpf || '';
            document.getElementById('hidden_nome').value = json.nome;
            document.getElementById('resto-form-atendimento').classList.remove('hidden');
        } else resDiv.innerHTML = `<span class="text-red-500 font-medium">Paciente não encontrado.</span>`;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { resDiv.innerText = "Erro na busca."; }
}

async function submitAtendimento(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    
    if(!data.cpf_paciente && !data.nome_paciente) { alert("Busque o paciente."); return; }
    
    if(await sendData('registerService', data, 'loading-atendimento')) { 
        if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    }
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (API)
// ============================================================================

async function excluirPacienteAPI(id, cpf) {
    // Reutiliza o loading do form paciente
    const loading = document.getElementById('loading-paciente');
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'deletePatient', data: { id: id, cpf: cpf } }) 
        });
        const json = await res.json();
        
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        
        if(json.status === 'success') {
            showMessage(json.message, 'success');
            if(typeof resetFormPaciente === 'function') resetFormPaciente();
            if(typeof voltarInicio === 'function') voltarInicio();
        } else {
            alert(json.message);
        }
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro ao excluir: " + e);
    }
}

async function excluirAtendimentoAPI(id) {
    const loading = document.getElementById('loading-atendimento');
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        const res = await fetch(SCRIPT_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'deleteService', data: { id: id } }) 
        });
        const json = await res.json();
        
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        
        if(json.status === 'success') {
            showMessage(json.message, 'success');
            if(typeof resetFormAtendimento === 'function') resetFormAtendimento();
            if(typeof voltarInicio === 'function') voltarInicio();
        } else {
            alert(json.message);
        }
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro ao excluir: " + e);
    }
}
