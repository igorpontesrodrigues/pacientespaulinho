// COPIE A URL DO SEU APPS SCRIPT AQUI
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNtohug1LnuzYn56ySQ97SvcmNbpxLeZgYYAeKwy_9tyWrH_l3SZKdcJElYQ2eVbEn3w/exec"; 

const CONFIG_SELECTS = [
    { id: 'municipio', label: 'Município', container: 'container_municipio', key: 'MUNICIPIO' },
    { id: 'bairro', label: 'Bairro', container: 'container_bairro', key: 'BAIRRO' },
    { id: 'status_titulo', label: 'Status Título', container: 'container_status_titulo', key: 'STATUS_TITULO' },
    { id: 'indicacao', label: 'Indicação', container: 'container_indicacao', key: 'INDICACAO' },
    { id: 'tipo_servico', label: 'Tipo Serviço', container: 'container_tipo_servico', key: 'TIPO_SERVICO' },
    { id: 'parceiro', label: 'Parceiro', container: 'container_parceiro', key: 'PARCEIRO' },
    { id: 'especialidade', label: 'Especialidade', container: 'container_especialidade', key: 'ESPECIALIDADE' },
    { id: 'procedimento', label: 'Procedimento', container: 'container_procedimento', key: 'PROCEDIMENTO' },
    { id: 'local', label: 'Local', container: 'container_local', key: 'LOCAL' },
    { id: 'tipo', label: 'Sub-Tipo / Detalhe', container: 'container_tipo', key: 'TIPO' },
    { id: 'status_atendimento', label: 'Status', container: 'container_status_atendimento', key: 'STATUS_ATENDIMENTO', nameOverride: 'status' }
];

// Variáveis Globais de Estado
let pacienteAtual = null;
let histPacienteAtual = null; 
let todosAtendimentos = [];
let todosPacientes = []; 
let opcoesFiltros = {};

// Globais para o Dashboard Analítico
let dashboardRawData = null;
let chartsInstance = {}; 

// Cache Global para Relatórios
window.dadosRelatorioCache = { especialidade: [], procedimento: [] };
