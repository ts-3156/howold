class ImagesController < ApplicationController
  def index
  end

  def show
  end

  def new
  end

  def upload
  end

  def analyze
    json =
      if request.content_type == 'application/json'
        Analyzer.send_url(params[:url])
      elsif request.content_type == 'application/octet-stream'
        Analyzer.upload_file(request.body.read)
      end
    render json: JSON.load(json)
  end

  def detect
    json =
      if request.content_type == 'application/json'
        Detector.send_url(params[:url])
      elsif request.content_type == 'application/octet-stream'
        Detector.upload_file(request.body.read)
      end
    render json: JSON.load(json)
  end

  def verify
    json =
      if request.content_type == 'application/json'
        Verifier.send_face_ids(params[:faceId1], params[:faceId2])
      end
    render json: JSON.load(json)
  end
end
