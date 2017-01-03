class CreateImages < ActiveRecord::Migration[5.0]
  def change
    create_table :images do |t|
      t.string :base64
      t.string :sha1

      t.timestamps
    end
  end
end
