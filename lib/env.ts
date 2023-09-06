import Environment from '@rdfjs/environment'
import DataFactory from '@rdfjs/environment/DataFactory.js'
import ClownfaceFactory from 'clownface/Factory.js'
import NsFactory from '@rdfjs/namespace/Factory.js'
import DatasetFactory from '@rdfjs/environment/DatasetFactory.js'

export default new Environment([DatasetFactory, DataFactory, ClownfaceFactory, NsFactory])
