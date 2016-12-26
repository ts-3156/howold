require 'net/http'

class Detector < ApplicationRecord
  def self.send_url(url)
    uri = URI('https://api.projectoxford.ai/face/v1.0/detect')
    uri.query = URI.encode_www_form({returnFaceAttributes: 'age,gender'})

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request['Ocp-Apim-Subscription-Key'] = ENV['DETECT_KEY']
    request.body = {url: url}.to_json

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end

  def self.upload_file(binary)
    uri = URI('https://api.projectoxford.ai/face/v1.0/detect')
    uri.query = URI.encode_www_form({returnFaceAttributes: 'age,gender'})

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/octet-stream'
    request['Ocp-Apim-Subscription-Key'] = ENV['DETECT_KEY']
    request.body = binary

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end
end
