/**
 * js/charts.js
 * Responsável por toda a lógica de visualização de dados usando Chart.js
 */

// Armazena as instâncias dos gráficos para poder destruí-las antes de recriar
// Evita o erro de "Canvas is already in use"
let chartsInstance = {};

/**
 * Helper auxiliar para contar frequência de campos (usado para gerar os dados dos gráficos)
 * Ex: Conta quantos atendimentos tem de "OFTALMOLOGIA", "PEDIATRIA", etc.
 * @param {Array} arr - Array de objetos (atendimentos ou pacientes)
 * @param {String} field - Nome do campo a ser contado
 * @returns {Array} - Array de arrays [[Nome, Qtd], ...] ordenado (Top 10)
 */
function countByField(arr, field) {
    const counts = {};
    arr.forEach(item => {
        const val = item[field] ? item[field].trim().toUpperCase() : 'N/I';
        counts[val] = (counts[val] || 0) + 1;
    });
    // Converte para array ordenado do maior para o menor
    return Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 10); // Retorna apenas o Top 10 para não poluir o gráfico
}

/**
 * Função principal chamada pelo Dashboard para renderizar todos os gráficos padrão
 * @param {Array} atendimentos - Lista filtrada de atendimentos
 * @param {Array} pacientes - Lista filtrada de pacientes
 */
function renderizarGraficos(atendimentos, pacientes) {
    // Configuração base visual para gráficos de barra horizontal
    const barOptions = { 
        indexAxis: 'y', 
        responsive: true, 
        plugins: { legend: { display: false } }, 
        scales: { x: { beginAtZero: true } } 
    };
    
    // 1. Gráfico de Especialidades (Top 10)
    const especData = countByField(atendimentos, 'especialidade');
    createChart('chartEspecialidade', 'bar', 
        especData.map(i=>i[0]), 
        especData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#3b82f6' } // Azul
    );

    // 2. Gráfico de Procedimentos
    const procData = countByField(atendimentos, 'procedimento');
    createChart('chartProcedimento', 'bar', 
        procData.map(i=>i[0]), 
        procData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#10b981' } // Verde Esmeralda
    );

    // 3. Gráfico de Locais
    const localData = countByField(atendimentos, 'local');
    createChart('chartLocal', 'bar', 
        localData.map(i=>i[0]), 
        localData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#8b5cf6' } // Roxo
    );

    // 4. Gráfico de Tipos de Serviço
    const tipoData = countByField(atendimentos, 'tipo');
    createChart('chartTipo', 'bar', 
        tipoData.map(i=>i[0]), 
        tipoData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#f59e0b' } // Âmbar/Laranja
    );

    // 5. Gráfico de Título de Eleitor (Pacientes) - BARRAS VERTICAIS (Torres)
    const tituloData = countByField(pacientes, 'status_titulo');
    
    // Opções específicas para Torres (Vertical)
    const towerOptions = { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }, // Remove legenda
        scales: { y: { beginAtZero: true } }     // Começa do zero
    };

    createChart('chartTitulo', 'bar', 
        tituloData.map(i=>i[0]), 
        tituloData.map(i=>i[1]), 
        { 
            ...towerOptions,
            // Cores variadas para cada torre para facilitar leitura
            backgroundColor: [
                '#22c55e', // Verde
                '#ef4444', // Vermelho
                '#eab308', // Amarelo
                '#94a3b8', // Cinza
                '#3b82f6'  // Azul
            ]
        }
    );
}

/**
 * Função genérica de baixo nível para criar ou atualizar um gráfico Chart.js
 * @param {String} canvasId - ID do elemento <canvas> no HTML
 * @param {String} type - Tipo do gráfico ('bar', 'line', 'doughnut', etc)
 * @param {Array} labels - Labels do eixo (Nomes)
 * @param {Array} data - Dados numéricos
 * @param {Object} options - Opções de customização do Chart.js
 */
function createChart(canvasId, type, labels, data, options) {
    // Se já existe um gráfico neste canvas, destrói ele antes de criar o novo
    if(chartsInstance[canvasId]) chartsInstance[canvasId].destroy();
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Define a cor de fundo (pode vir única ou array)
    const bg = options.backgroundColor;

    // CONFIGURAÇÃO DOS VALORES NA PONTA DAS BARRAS (DATALABELS)
    const defaultDatalabels = {
        anchor: 'end', 
        align: 'end',  
        color: '#64748b', 
        font: { weight: 'bold', size: 11 },
        formatter: (value) => value > 0 ? value : '' // Não mostra zero
    };

    // Mescla configurações padrão com as passadas por parâmetro
    const userDatalabels = options.plugins && options.plugins.datalabels ? options.plugins.datalabels : {};
    
    const chartOptions = {
        ...options,
        layout: {
            // Adiciona margem interna para o número não ser cortado na borda do canvas
            padding: { top: 25, right: 35, left: 0, bottom: 0 }
        },
        plugins: {
            ...options.plugins,
            datalabels: { ...defaultDatalabels, ...userDatalabels }
        }
    };

    // Cria a nova instância e salva no objeto global
    chartsInstance[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bg,
                borderWidth: 1
            }]
        },
        options: chartOptions,
        plugins: [ChartDataLabels] // Ativa o plugin de rótulos de dados
    });
}
