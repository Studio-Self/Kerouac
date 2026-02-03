class CreateConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :connections do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.integer :platform, null: false
      t.string :name, null: false
      t.string :identifier, null: false
      t.text :credentials
      t.integer :status, default: 0
      t.datetime :last_synced_at
      t.text :last_error
      t.integer :posts_count, default: 0

      t.timestamps
    end

    add_index :connections, [:user_id, :platform]
    add_index :connections, :status
  end
end
