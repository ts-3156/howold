require 'base64'
require 'open-uri'

class Image < ApplicationRecord
  def self.build_from_url(url)
    type = FastImage.type(url).to_s
    return nil unless type.match(/jpe?g|png|gif/)
    Image.new(base64: 'data:image/' + type + ';base64,' + Base64.strict_encode64(open(url).read))
  end

  def self.build_from_file(path)
    type = FastImage.type(path).to_s
    return nil unless type.match(/jpe?g|png|gif/)
    Image.new(base64: 'data:image/' + type + ';base64,' + Base64.strict_encode64(File.read(path)))
  end
end
