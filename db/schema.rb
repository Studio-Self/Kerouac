# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_02_061127) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "connections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "credentials"
    t.string "identifier", null: false
    t.text "last_error"
    t.datetime "last_synced_at"
    t.string "name", null: false
    t.integer "platform", default: 0, null: false
    t.integer "posts_count", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["platform"], name: "index_connections_on_platform"
    t.index ["status"], name: "index_connections_on_status"
    t.index ["user_id", "platform", "identifier"], name: "index_connections_on_user_id_and_platform_and_identifier", unique: true
    t.index ["user_id"], name: "index_connections_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "connection_id", null: false
    t.datetime "created_at", null: false
    t.string "external_id", null: false
    t.integer "platform", null: false
    t.integer "post_type", default: 0, null: false
    t.datetime "published_at", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.integer "word_count", default: 0
    t.index ["connection_id", "external_id"], name: "index_posts_on_connection_id_and_external_id", unique: true
    t.index ["connection_id"], name: "index_posts_on_connection_id"
    t.index ["platform"], name: "index_posts_on_platform"
    t.index ["post_type"], name: "index_posts_on_post_type"
    t.index ["published_at"], name: "index_posts_on_published_at"
    t.index ["user_id", "published_at"], name: "index_posts_on_user_id_and_published_at"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "connections", "users", on_delete: :cascade
  add_foreign_key "posts", "connections", on_delete: :cascade
  add_foreign_key "posts", "users", on_delete: :cascade
end
