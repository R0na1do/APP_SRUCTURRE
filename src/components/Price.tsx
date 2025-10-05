export default function Price({ cents, code='USD' }: { cents: number; code?: string }) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format((cents||0)/100)
}
