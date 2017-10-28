install.packages("MASS")
library("MASS")

segreg = read.csv("data/segregacion-escuela-euskadi.csv")
attach(segreg)


parcoord(segreg[,c(1,3,4,5,6,7)])
parcoord(segreg[,c(4,5)])

parcoord(segreg[,c(3,4,5)],col=rainbow(length(segreg[,1])))
parcoord(segreg[,c(4,5)],col=rainbow(length(segreg[,3])))

parcoord(cardeaths, col=rainbow(length(cardeaths[,1])), var.label=TRUE)
