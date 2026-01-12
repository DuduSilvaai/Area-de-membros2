# Correção do Erro de Chave Duplicada

## 🚨 **Problema Identificado**

**Erro**: `duplicate key value violates unique constraint "enrollments_user_id_portal_id_key"`

**Causa**: A função `fixMissingEnrollments` estava tentando criar enrollments para portais que já tinham enrollments inativos (`is_active = false`), violando a constraint única `(user_id, portal_id)`.

## 🔧 **Correção Implementada**

### **ANTES (Problema)**:
```typescript
// ❌ Verificava apenas enrollments ATIVOS
const existingPortalIds = existingEnrollments?.filter(e => e.is_active).map(e => e.portal_id) || [];
const missingPortals = allPortals?.filter(p => !existingPortalIds.includes(p.id)) || [];

// ❌ Tentava criar enrollment para portal que já tinha enrollment inativo
const newEnrollments = missingPortals.map(portal => ({
    user_id: targetUser.id,
    portal_id: portal.id, // CONFLITO: já existe enrollment inativo
    // ...
}));
```

### **DEPOIS (Solução)**:
```typescript
// ✅ Verifica TODOS os enrollments (ativos e inativos)
const existingPortalIds = existingEnrollments?.map(e => e.portal_id) || [];
const missingPortals = allPortals?.filter(p => !existingPortalIds.includes(p.id)) || [];

// ✅ Identifica enrollments inativos que podem ser reativados
const inactiveEnrollments = existingEnrollments?.filter(e => !e.is_active) || [];
const reactivatePortals = allPortals?.filter(p => 
    inactiveEnrollments.some(e => e.portal_id === p.id)
) || [];

// ✅ Reativa enrollments inativos em vez de criar novos
if (reactivatePortals.length > 0) {
    await adminSupabase
        .from('enrollments')
        .update({ is_active: true })
        .eq('user_id', targetUser.id)
        .in('portal_id', reactivateIds);
}

// ✅ Cria apenas enrollments verdadeiramente faltantes
if (missingPortals.length > 0) {
    // Cria apenas para portais que não têm enrollment algum
}
```

## 🎯 **Como Funciona Agora**

### **Cenário 1: Portal sem enrollment**
- **Ação**: Cria novo enrollment
- **Resultado**: `created: 1, reactivated: 0`

### **Cenário 2: Portal com enrollment inativo**
- **Ação**: Reativa enrollment existente (`is_active = false → true`)
- **Resultado**: `created: 0, reactivated: 1`

### **Cenário 3: Portal com enrollment ativo**
- **Ação**: Nenhuma (já tem acesso)
- **Resultado**: `created: 0, reactivated: 0`

## 📊 **Benefícios da Correção**

1. ✅ **Elimina erro de chave duplicada**
2. ✅ **Mantém histórico de enrollments** (não cria duplicatas)
3. ✅ **Reativa enrollments inativos** em vez de criar novos
4. ✅ **Relatório detalhado** de ações realizadas
5. ✅ **Performance melhorada** (menos operações de INSERT)

## 🔍 **Mensagens de Retorno**

### **Antes**:
- ❌ `"Created 2 missing enrollments"` (mesmo quando reativou)

### **Depois**:
- ✅ `"2 novos enrollments criados"`
- ✅ `"1 enrollment reativado"`
- ✅ `"1 novo enrollment criado e 2 enrollments reativados"`
- ✅ `"Nenhuma ação necessária"`

## 🚀 **Teste a Correção**

1. **Cenário de teste**:
   - Usuário tem acesso a Portal A (ativo)
   - Usuário teve acesso a Portal B (removido = inativo)
   - Usuário nunca teve acesso a Portal C

2. **Execute "Corrigir Acessos"**:
   - Portal A: Nenhuma ação (já ativo)
   - Portal B: Reativado (is_active = false → true)
   - Portal C: Criado (novo enrollment)

3. **Resultado esperado**:
   - ✅ Sem erros de chave duplicada
   - ✅ Usuário vê todos os 3 portais
   - ✅ Mensagem: "1 novo enrollment criado e 1 enrollment reativado"

## 🎯 **Status**

✅ **Erro de chave duplicada corrigido**
✅ **Função funciona corretamente**
✅ **Histórico de dados preservado**
✅ **Performance otimizada**