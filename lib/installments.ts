export interface GeneratedInstallment {
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
}

/**
 * Divide o valor total em `totalInstallments` parcelas (o resto da divisão vai para a
 * última parcela, para o somatório bater exatamente com o valor da compra) com vencimento
 * mensal a partir de `firstDueDate`.
 */
export function generateInstallments(
  totalAmount: number,
  totalInstallments: number,
  firstDueDate: string
): GeneratedInstallment[] {
  const baseAmount = Math.floor((totalAmount / totalInstallments) * 100) / 100;
  const roundingRemainder = Math.round((totalAmount - baseAmount * totalInstallments) * 100) / 100;

  const [year, month, day] = firstDueDate.split("-").map(Number);

  return Array.from({ length: totalInstallments }, (_, index) => {
    const dueDate = new Date(year, month - 1 + index, day);
    const isLast = index === totalInstallments - 1;

    return {
      installment_number: index + 1,
      total_installments: totalInstallments,
      amount: isLast ? Math.round((baseAmount + roundingRemainder) * 100) / 100 : baseAmount,
      due_date: dueDate.toISOString().slice(0, 10),
    };
  });
}
