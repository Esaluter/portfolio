type BlockAction = {
  icon: string
  name: string
  description: string
  onAdd: () => void
}

type BlockCategory = {
  name: string
  blocks: BlockAction[]
}

type BlockCatalogProps = {
  collapsed: boolean
  onToggle: () => void
  categories: BlockCategory[]
}

function BlockCatalog({ collapsed, onToggle, categories }: BlockCatalogProps) {
  return (
    <aside className={`block-catalog ${collapsed ? 'block-catalog--collapsed' : ''}`}>
      <div className="side-panel__header">
        {!collapsed && <strong>Блоки</strong>}
        <button
          className="icon-button"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Развернуть каталог блоков' : 'Свернуть каталог блоков'}
          title={collapsed ? 'Развернуть каталог блоков' : 'Свернуть каталог блоков'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {!collapsed && (
        <div className="block-catalog__content">
          {categories.map((category) => (
            <section className="block-category" key={category.name}>
              <h2>{category.name}</h2>
              {category.blocks.map((block) => (
                <button
                  className="block-catalog__item"
                  type="button"
                  key={block.name}
                  onClick={block.onAdd}
                  title={block.description}
                >
                  <span className="block-catalog__icon" aria-hidden="true">
                    {block.icon}
                  </span>
                  <span>
                    <strong>{block.name}</strong>
                    <small>{block.description}</small>
                  </span>
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </aside>
  )
}

export default BlockCatalog
