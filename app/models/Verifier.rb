require 'net/http'

class Verifier < ApplicationRecord
  def self.send_face_ids(face_id1, face_id2)
    uri = URI('https://api.projectoxford.ai/face/v1.0/verify')

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request['Ocp-Apim-Subscription-Key'] = ENV['VERIFY_KEY']
    request.body = {faceId1: face_id1, faceId2: face_id2}.to_json

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end
end
