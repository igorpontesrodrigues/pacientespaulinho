/**
 * js/main.js
 * Ponto de entrada da aplicação.
 * Inicializa bibliotecas, define eventos globais e carrega a primeira tela.
 */

window.onload = function() {
    // 1. Inicializa ícones (Lucide)
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Define valores padrão nos formulários
    const dataAbertura = document.getElementById('data_abertura');
    if(dataAbertura) dataAbertura.valueAsDate = new Date();

    const filtroNiver = document.getElementById('filtro-niver-mes');
    if(filtroNiver) filtroNiver.value = new Date().getMonth() + 1; 

    // 3. Renderiza a estrutura vazia dos selects (loading state)
    // Função definida em ui.js
    if(typeof renderizarSelectsVazios === 'function') renderizarSelectsVazios();

    // 4. Busca as opções do Google Sheets para preencher os selects
    // Função definida em api.js
    if(typeof carregarFiltros === 'function') carregarFiltros();

    // 5. Carrega a aba inicial (Dashboard)
    // Função definida em ui.js
    if(typeof switchTab === 'function') switchTab('dashboard'); 
};


// ============================================================================
// EVENT LISTENERS GLOBAIS
// ============================================================================

// 1. Monitora digitação nos inputs de "Cadastrar Novo" (switched-input)
// Ao digitar no input visível, preenche o input hidden com o valor em MAIÚSCULO
document.addEventListener('input', function(e) {
    if(e.target.classList.contains('switched-input')) {
        const id = e.target.id.replace('inp_', '');
        const hiddenField = document.getElementById(`field_${id}`);
        if(hiddenField) {
            hiddenField.value = e.target.value.toUpperCase();
        }
    }
});

// 2. Monitora mudanças em campos que afetam a Data de Risco
// Se mudar a especialidade (Ex: Oftalmologia) ou a data de marcação, recalcula o prazo.
document.addEventListener('change', function(e) {
    const idsMonitorados = ['sel_especialidade', 'inp_especialidade', 'field_data_marcacao'];
    
    if(idsMonitorados.includes(e.target.id)) {
        // Pequeno delay para garantir que o valor do select já tenha ido para o hidden field
        if(typeof calcularDataRisco === 'function') {
            setTimeout(calcularDataRisco, 100);
        }
    }
});
