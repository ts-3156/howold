class ImagesController < ApplicationController
  before_action :set_image, only: [:show, :edit, :update, :destroy]

  def index
    @images = Image.all
  end

  def show
  end

  def new
    @image = Image.new
  end

  def edit
  end

  def create
    @image = Image.new(image_params)

    respond_to do |format|
      if @image.save
        format.html { redirect_to @image, notice: 'Image was successfully created.' }
        format.json { render :show, status: :created, location: @image }
      else
        format.html { render :new }
        format.json { render json: @image.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @image.update(image_params)
        format.html { redirect_to @image, notice: 'Image was successfully updated.' }
        format.json { render :show, status: :ok, location: @image }
      else
        format.html { render :edit }
        format.json { render json: @image.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @image.destroy
    respond_to do |format|
      format.html { redirect_to images_url, notice: 'Image was successfully destroyed.' }
      format.json { head :no_content }
    end
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

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_image
      @image = Image.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def image_params
      params.require(:image).permit(:url)
    end
end
