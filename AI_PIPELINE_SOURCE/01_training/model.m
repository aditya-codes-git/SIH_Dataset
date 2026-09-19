data = readtable('train.csv');

imds = imageDatastore('train_images', ...
    'FileExtensions',{'.png','.jpg','.jpeg'});

labels = categorical(data.diagnosis);
imds.Labels = labels;

[trainImds,valImds] = splitEachLabel(imds,0.8,'randomized');

net = resnet18;

