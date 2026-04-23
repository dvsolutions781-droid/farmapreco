import { formatBRL, calcEconomy, truncateProd } from '../utils/format';
import { PlusIcon, CheckIcon, ChevronRightIcon, MapPinIcon } from './Icons';

export default function ProductCard({ product, isFirst, inBasket, justAdded, onAdd, onDetail }) {
  const economy = calcEconomy(product.precoMinimo, product.precoMaximo);
  const cheapest = product.estabelecimentos?.[0];

  return (
    <div
      className="card animate-in"
      style={{
        marginBottom: 12,
        border: isFirst ? '2px solid var(--green)' : '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isFirst && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--green)', color: 'white',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          padding: '3px 10px', borderBottomLeftRadius: 8,
          textTransform: 'uppercase'
        }}>
          Menor preço
        </div>
      )}

      {/* Product name */}
      <div
        style={{ cursor: 'pointer', marginBottom: 10 }}
        onClick={onDetail}
      >
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4, paddingRight: 48, color: 'var(--text)' }}>
          {truncateProd(product.descricao, 60)}
        </div>
        {product.gtin && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {product.gtin}
          </div>
        )}
      </div>

      {/* Price range */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>A partir de</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {formatBRL(product.precoMinimo)}
          </div>
        </div>
        {product.precoMaximo > product.precoMinimo && (
          <div style={{ marginBottom: 2 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>até {formatBRL(product.precoMaximo)}</div>
            {economy > 0 && (
              <div className="price-highlight" style={{ marginTop: 3, fontSize: 11 }}>
                💰 {economy}% de variação
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cheapest store */}
      {cheapest && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg)', borderRadius: 8, padding: '8px 10px',
          marginBottom: 12, cursor: 'pointer'
        }} onClick={onDetail}>
          <MapPinIcon size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cheapest.nome}
            </div>
            {cheapest.endereco && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cheapest.endereco}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {product.estabelecimentos.length} local{product.estabelecimentos.length !== 1 ? 'is' : ''}
            <ChevronRightIcon size={12} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-sm"
          style={{
            flex: 1,
            background: justAdded ? 'var(--green)' : inBasket ? 'var(--green-light)' : 'var(--primary)',
            color: inBasket ? 'var(--green)' : 'white',
            transition: 'all 0.25s ease',
            border: inBasket && !justAdded ? '1.5px solid var(--green)' : 'none'
          }}
          onClick={onAdd}
          disabled={inBasket && !justAdded}
        >
          {justAdded ? <><CheckIcon size={15} /> Adicionado!</> :
           inBasket ? <><CheckIcon size={15} /> Na cesta</> :
           <><PlusIcon size={15} /> Adicionar à cesta</>}
        </button>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', paddingLeft: 12, paddingRight: 12 }}
          onClick={onDetail}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}
