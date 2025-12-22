function showMessage(msg, type) {
    const el = document.getElementById('system-message');
    el.innerHTML = msg;
    el.className = `mb-4 p-4 rounded-lg border flex items-center gap-2 ${type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`;
    el.classList.remove('hidden');
    if(type !== 'error') setTimeout(() => el.classList.add('hidden'), 5000);
}

function switchTab(tabId) {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const views = ['view-lista-pacientes', 'view-lista-atendimentos', 'view-form-paciente', 'view-form-atendimento', 'view-dashboard', 'view-aniversarios', 'view-relatorios', 'view-parceiros', 'view-historico-paciente', 'view-detalhe-atendimento'];
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
        if(listaVisible) carregarListaPacientes();
        else carregarAniversarios();
    }

    if (tabId === 'lista-atendimentos') carregarListaAtendimentos();
    if (tabId === 'dashboard') loadDashboard();
    
    if (tabId === 'parceiros') initParceiros();
    if (tabId === 'relatorios') initRelatorios();
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
        carregarListaPacientes();
    } else {
        listaDiv.classList.add('hidden');
        niverDiv.classList.remove('hidden');
        buscaContainer.classList.add('hidden');
        filtroNiver.classList.remove('hidden');
        filtroNiver.style.display = 'flex';
        btnNiver.className = "text-pink-600 border-b-2 border-pink-600 pb-2 transition-all flex items-center gap-1";
        btnLista.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all";
        carregarAniversarios();
    }
}

function renderizarSelectsVazios() {
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
    btnEdit.onclick = function() {
        fecharDetalhe();
        abrirEdicaoAtendimento(at);
    };
}

function fecharDetalhe() {
    document.getElementById('modal-backdrop-detalhe').classList.add('hidden');
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

    document.getElementById('data_abertura').value = at.data_abertura || '';
    document.getElementById('field_lideranca').value = at.lideranca || ''; 
    document.getElementById('field_tipo').value = at.tipo || '';
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    document.getElementById('field_valor').value = at.valor || '';
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';

    ['indicacao','tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => preencherSelectInteligente(k, at[k === 'status_atendimento' ? 'status' : k]));
}

function abrirEdicaoAtendimentoId(id) {
    const at = todosAtendimentos.find(x => x.id === id);
    if(at) abrirEdicaoAtendimento(at);
}

function abrirAtendimentoDireto(cpf, id) {
    if(!cpf || cpf.length < 5) { alert("Paciente sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
    switchTab('form-atendimento');
    document.getElementById('busca_cpf').value = cpf;
    buscarPacienteParaAtendimento();
}

function abrirEdicaoDireta(cpf, id) {
    switchTab('form-paciente');
    document.getElementById('paciente_cpf_check').value = cpf;
    if(cpf && cpf.length > 4) verificarCpfInicial();
    else if(id) verificarPorId(id);
}

function editarPaciente() { if(pacienteAtual) mostrarFormularioPaciente(true, pacienteAtual); }

function mostrarFormularioPaciente(isEdit, dados = null) {
    document.getElementById('resto-form-paciente').classList.remove('hidden');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    
    const btnPrint = document.getElementById('btn-imprimir');
    if(isEdit) btnPrint.classList.remove('hidden');
    else btnPrint.classList.add('hidden');

    if(isEdit && dados) {
        document.getElementById('paciente_id_hidden').value = dados.id;
        ['nome','apelido','familia','rg','nascimento','sexo','tel1','tel2','cep','logradouro','bairro','municipio','sus','titulo','status_titulo','municipio_titulo','zona','secao','obs'].forEach(k => {
            if(document.getElementById(`field_${k}`)) {
                if(['municipio','bairro','status_titulo'].includes(k)) {
                    preencherSelectInteligente(k, dados[k]);
                } else if(k === 'municipio_titulo') {
                    document.getElementById(`field_${k}`).value = dados[k] || '';
                } else {
                    document.getElementById(`field_${k}`).value = dados[k] || '';
                }
            }
        });
    }
}

function resetFormPaciente() {
    document.getElementById('frmPaciente').reset();
    document.getElementById('paciente_id_hidden').value = "";
    document.getElementById('msg_cpf_paciente').innerText = '';
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    document.getElementById('btn-imprimir').classList.add('hidden');
    
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
    document.getElementById('data_abertura').valueAsDate = new Date();
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel) sel.value = "";
        cancelSelectNew(cfg.id);
    });
}

function voltarInicio() { switchTab('lista-pacientes'); }

function renderizarTabelaPacientes(lista) {
    const tbody = document.getElementById('tabela-pacientes-body');
    tbody.innerHTML = '';
    if(lista.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>'; return; }
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors";
        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800 uppercase" onclick="verHistoricoCompleto(${pStr})">${p.nome}</td>
            <td class="px-6 py-4 text-slate-600" onclick="verHistoricoCompleto(${pStr})">${p.cpf || '<span class="text-orange-500 text-xs font-bold px-2 py-1 bg-orange-100 rounded">SEM CPF</span>'}</td>
            <td class="px-6 py-4 hidden sm:table-cell text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.tel||'-'}</td>
            <td class="px-6 py-4 hidden md:table-cell uppercase text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.municipio||'-'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirAtendimentoDireto('${p.cpf}','${p.id}')" class="bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-2 hover:bg-emerald-200 transition" title="Novo Atendimento"><i data-lucide="plus" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); abrirEdicaoDireta('${p.cpf}','${p.id}')" class="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function filtrarPacientesNaTela() {
    const termo = document.getElementById('filtro-paciente-input').value.toLowerCase();
    const filtrados = todosPacientes.filter(p => {
        const nome = p.nome ? String(p.nome).toLowerCase() : '';
        const cpf = p.cpf ? String(p.cpf) : '';
        const municipio = p.municipio ? String(p.municipio).toLowerCase() : '';
        
        return nome.includes(termo) || cpf.includes(termo) || municipio.includes(termo);
    });
    renderizarTabelaPacientes(filtrados);
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
            <td class="px-6 py-4 text-right"><button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button></td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    document.getElementById('contador-atendimentos').innerText = `Exibindo ${filtrados.length} registros`;
    lucide.createIcons();
}

function calcularDataRisco() {
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const especialidade = document.getElementById('field_especialidade').value.toUpperCase();
    
    if(!dataMarcacao) return;

    const d = new Date(dataMarcacao);
    let meses = 3; 
    if(especialidade.includes("OFTALMOLOGIA")) meses = 6;

    d.setMonth(d.getMonth() + meses);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    document.getElementById('field_data_risco').value = `${yyyy}-${mm}-${dd}`;
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

    renderizarGraficos(atendimentosFiltrados, pacientesFiltrados);
    calcularMetricasTempo(atendimentosFiltrados);
    renderizarTorreGenero(pacientesFiltrados);
}

function abrirListaRelatorio(tipo, index) {
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
                <div class="text-xs text-slate-400 flex gap-2">
                    <span>${at.local || 'Local N/I'}</span>
                    <span class="text-slate-300">|</span>
                    <span>CPF: ${at.cpf || '...'}</span>
                </div>
            </td>
            <td class="px-6 py-3 text-right">
                <span class="${badgeEspera} px-2 py-1 rounded text-xs font-bold">${at.diasEspera} dias</span>
            </td>
        `;
        tr.onclick = () => {
            document.getElementById('modal-lista-relatorio').classList.add('hidden');
            abrirDetalheAtendimento(window[tempId]);
        };
        tbody.appendChild(tr);
    });
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
                
                const atNormalizado = {
                    ...at,
                    id: at.id,
                    cpf: at.cpf_paciente, 
                    nome: at.nome_paciente || 'Nome não carregado (Atualize o Script)', 
                    diasEspera: dias
                };
                
                grupos[chave].lista.push(atNormalizado);
            }
        });

        return Object.entries(grupos)
            .map(([nome, dados]) => ({ 
                nome, 
                mediaDias: Math.round(dados.total / dados.qtd),
                qtd: dados.qtd,
                lista: dados.lista.sort((a,b) => b.diasEspera - a.diasEspera) 
            }))
            .sort((a,b) => b.mediaDias - a.mediaDias) 
            .slice(0, 10); 
    };

    const dadosEspecialidade = processarMedia('especialidade');
    const dadosProcedimento = processarMedia('procedimento');

    window.dadosRelatorioCache['especialidade'] = dadosEspecialidade;
    window.dadosRelatorioCache['procedimento'] = dadosProcedimento;

    const renderizarTabelaGrafica = (containerId, dados, corBarra, tipo) => {
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
        lucide.createIcons();
    };

    renderizarTabelaGrafica('listaRelEspecialidade', dadosEspecialidade, 'bg-rose-500', 'especialidade');
    renderizarTabelaGrafica('listaRelProcedimento', dadosProcedimento, 'bg-violet-500', 'procedimento');
}

function renderizarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
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
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}
