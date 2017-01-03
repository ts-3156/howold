Rails.application.routes.draw do
  root 'images#index'
  resources :images, only: 'show'
  %i(analyze detect verify).each do |name|
    post "images/#{name}", to: "images##{name}", as: name
  end
end
