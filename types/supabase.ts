export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          cor: string
          tipo: 'entrada' | 'saida' | 'ambos'
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cor: string
          tipo: 'entrada' | 'saida' | 'ambos'
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string
          tipo?: 'entrada' | 'saida' | 'ambos'
          user_id?: string
          created_at?: string
        }
      }
      contas: {
        Row: {
          id: string
          nome: string
          tipo: 'corrente' | 'poupanca' | 'investimento' | 'dinheiro' | 'outros'
          saldo: number
          instituicao: string | null
          cor: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'corrente' | 'poupanca' | 'investimento' | 'dinheiro' | 'outros'
          saldo: number
          instituicao?: string | null
          cor: string
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'corrente' | 'poupanca' | 'investimento' | 'dinheiro' | 'outros'
          saldo?: number
          instituicao?: string | null
          cor?: string
          user_id?: string
          created_at?: string
        }
      }
      lancamentos: {
        Row: {
          id: string
          descricao: string
          valor: number
          data: string
          tipo: 'entrada' | 'saida'
          categoria_id: string | null
          conta_id: string | null
          comprovante_url: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          descricao: string
          valor: number
          data: string
          tipo: 'entrada' | 'saida'
          categoria_id?: string | null
          conta_id?: string | null
          comprovante_url?: string | null
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          valor?: number
          data?: string
          tipo?: 'entrada' | 'saida'
          categoria_id?: string | null
          conta_id?: string | null
          comprovante_url?: string | null
          user_id?: string
          created_at?: string
        }
      }
      metas_financeiras: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          valor_meta: number
          valor_atual: number
          data_inicio: string
          data_fim: string | null
          cor: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          valor_meta: number
          valor_atual: number
          data_inicio: string
          data_fim?: string | null
          cor: string
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          valor_meta?: number
          valor_atual?: number
          data_inicio?: string
          data_fim?: string | null
          cor?: string
          user_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
    }
  }
}
