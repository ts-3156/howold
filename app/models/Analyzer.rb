require 'net/http'

class Analyzer < ApplicationRecord
  def self.send_url(url)
    uri = URI('https://api.projectoxford.ai/vision/v1.0/analyze')
    uri.query = URI.encode_www_form({visualFeatures: 'Categories,Tags,Description,Faces,ImageType,Color,Adult', details: 'Celebrities'})

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request['Ocp-Apim-Subscription-Key'] = ENV['ANALYZE_KEY']
    request.body = {url: url}.to_json

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end

  def self.upload_file(binary)
    uri = URI('https://api.projectoxford.ai/vision/v1.0/analyze')
    uri.query = URI.encode_www_form({visualFeatures: 'Categories,Tags,Description,Faces,ImageType,Color,Adult', details: 'Celebrities'})

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/octet-stream'
    request['Ocp-Apim-Subscription-Key'] = ENV['ANALYZE_KEY']
    request.body = binary

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end
end
