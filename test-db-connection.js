// Script para testar a conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas variáveis de ambiente que estão no .env.local
const supabaseUrl = 'https://jsiuymggoblgwaftqsui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaXV5bWdnb2JsZ3dhZnRxc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjYzMzksImV4cCI6MjA3MTU0MjMzOX0.MEoFN8pSEvJtwQLyTFi2KbExoH4gDLUqMGqrY8KWWRg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testando conexão com o Supabase...');
  
  try {
    // Tentar buscar dados da tabela lancamentos
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro ao acessar a tabela lancamentos:', error);
    } else {
      console.log('Conexão bem-sucedida!');
      console.log('Dados retornados:', data);
    }
  } catch (err) {
    console.error('Erro ao conectar com o Supabase:', err);
  }
}

testConnection();
