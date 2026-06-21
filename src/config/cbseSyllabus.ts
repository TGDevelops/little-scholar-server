import type { Subject } from '../validators/exam.validator';
import type { SupportedGrade } from './supportedGrades';

export type ConceptMapBySubject = Partial<Record<Subject, string[]>>;

export const cbseConceptMap: Record<SupportedGrade, ConceptMapBySubject> = {
  Nursery: {
    Maths: [
      'Counting 1 to 5',
      'Big and small',
      'Same and different',
      'Basic shapes',
      'Basic colors',
      'More and less'
    ],
    English: [
      'Object recognition',
      'Picture vocabulary',
      'Alphabet exposure',
      'Listening words',
      'Beginning sounds'
    ],
    EVS: [
      'Animals',
      'Birds',
      'Fruits',
      'Vegetables',
      'Family',
      'Body parts',
      'Good habits'
    ],
    GK: ['Animals', 'Fruits', 'Vegetables', 'Colors', 'Shapes', 'Common objects']
  },
  LKG: {
    Maths: [
      'Counting 1 to 10',
      'Number recognition',
      'Missing numbers',
      'Shapes',
      'Sorting',
      'Big small tall short',
      'More and less',
      'Same and different'
    ],
    English: [
      'Alphabet recognition',
      'Beginning sounds',
      'Picture word association',
      'Simple vocabulary',
      'Rhyming sounds'
    ],
    Hindi: ['Swar recognition', 'Basic Hindi letters', 'Picture word association'],
    EVS: [
      'Animals',
      'Birds',
      'Fruits',
      'Vegetables',
      'My family',
      'My body',
      'Good habits',
      'Cleanliness',
      'Safety basics'
    ],
    GK: ['Animals', 'Birds', 'Fruits', 'Vegetables', 'Colors', 'Shapes', 'Community helpers']
  },
  UKG: {
    Maths: [
      'Counting 1 to 50',
      'Before and after numbers',
      'Missing numbers',
      'Number comparison',
      'Simple addition',
      'Simple subtraction',
      'Patterns',
      'Shapes',
      'More and less'
    ],
    English: [
      'Vowels',
      'Consonants',
      'CVC words',
      'Rhyming words',
      'Simple sentences',
      'Picture comprehension',
      'Opposites'
    ],
    Hindi: ['Swar', 'Vyanjan', 'Simple Hindi words', 'Picture word matching'],
    EVS: [
      'Plants',
      'Animals',
      'Transport',
      'Community helpers',
      'Seasons',
      'Good habits',
      'My school',
      'My neighbourhood'
    ],
    GK: [
      'Animals',
      'Birds',
      'Fruits',
      'Vegetables',
      'Transport',
      'Community helpers',
      'Seasons',
      'Basic India awareness'
    ]
  },
  'Grade 1': {
    Maths: [
      'Numbers up to 100',
      'Number names',
      'Addition within 20',
      'Subtraction within 20',
      'Missing addends',
      'Number sequences',
      'Comparison of numbers',
      'Shapes',
      'Measurement basics',
      'Time basics',
      'Money basics'
    ],
    English: [
      'Simple sentences',
      'Nouns',
      'Action words',
      'Opposites',
      'Rhyming words',
      'Reading comprehension',
      'Picture comprehension',
      'Articles a an the'
    ],
    Hindi: ['Swar', 'Vyanjan', 'Simple words', 'Matra basics', 'Picture comprehension'],
    EVS: [
      'My body',
      'My family',
      'Food',
      'Water',
      'Plants',
      'Animals',
      'Transport',
      'Festivals',
      'Safety habits',
      'Cleanliness'
    ],
    GK: [
      'Animals',
      'Birds',
      'Fruits',
      'Vegetables',
      'National symbols',
      'Community helpers',
      'Seasons',
      'Basic India awareness'
    ]
  },
  'Grade 2': {
    Maths: [
      'Numbers up to 200',
      'Place value',
      'Addition within 100',
      'Subtraction within 100',
      'Skip counting',
      'Number patterns',
      'Shapes',
      'Measurement',
      'Time',
      'Money',
      'Data handling basics'
    ],
    English: [
      'Reading comprehension',
      'Simple grammar',
      'Nouns',
      'Verbs',
      'Adjectives',
      'Pronouns',
      'Opposites',
      'Synonyms',
      'Sentence formation'
    ],
    Hindi: [
      'Matra',
      'Simple sentences',
      'Nouns',
      'Verbs',
      'Picture comprehension',
      'Reading simple Hindi text'
    ],
    EVS: [
      'Our body',
      'Family and friends',
      'Food and health',
      'Water',
      'Plants',
      'Animals',
      'Shelter',
      'Transport',
      'Safety and cleanliness'
    ],
    GK: [
      'India basics',
      'National symbols',
      'Famous places',
      'Animals and birds',
      'Plants',
      'Community helpers',
      'Festivals',
      'Sports basics'
    ]
  },
  'Grade 3': {
    Maths: [
      'Numbers up to 1000',
      'Place value',
      'Addition and subtraction',
      'Multiplication basics',
      'Division basics',
      'Fractions introduction',
      'Shapes and patterns',
      'Measurement',
      'Time',
      'Money',
      'Data handling'
    ],
    English: [
      'Reading comprehension',
      'Nouns',
      'Pronouns',
      'Verbs',
      'Adjectives',
      'Tenses introduction',
      'Sentence formation',
      'Synonyms and antonyms',
      'Punctuation'
    ],
    Hindi: [
      'Reading comprehension',
      'Matra revision',
      'Nouns',
      'Verbs',
      'Adjectives',
      'Simple grammar',
      'Sentence formation'
    ],
    EVS: [
      'Family and relationships',
      'Plants',
      'Animals',
      'Food',
      'Water',
      'Shelter',
      'Travel and transport',
      'Safety',
      'Environment basics'
    ],
    GK: [
      'India states and capitals basics',
      'National symbols',
      'Famous personalities',
      'Science around us',
      'Animals and plants',
      'Sports',
      'Current awareness for kids'
    ]
  },
  'Grade 4': {
    Maths: [
      'Large numbers',
      'Place value',
      'Addition subtraction multiplication division',
      'Factors and multiples introduction',
      'Fractions',
      'Decimals introduction',
      'Geometry basics',
      'Perimeter introduction',
      'Measurement',
      'Time',
      'Money',
      'Data handling'
    ],
    English: [
      'Reading comprehension',
      'Nouns and pronouns',
      'Verbs and tenses',
      'Adjectives and adverbs',
      'Prepositions',
      'Conjunctions',
      'Punctuation',
      'Vocabulary',
      'Sentence transformation'
    ],
    Hindi: [
      'Reading comprehension',
      'Grammar basics',
      'Nouns',
      'Pronouns',
      'Verbs',
      'Adjectives',
      'Tenses',
      'Sentence formation',
      'Vocabulary'
    ],
    EVS: [
      'Human body',
      'Plants',
      'Animals',
      'Food and nutrition',
      'Water conservation',
      'Shelter',
      'Transport and communication',
      'Environment',
      'Safety and first aid'
    ],
    GK: [
      'India geography basics',
      'World basics',
      'Science facts',
      'Famous Indians',
      'Sports',
      'Books and authors for kids',
      'Environment awareness'
    ]
  },
  'Grade 5': {
    Maths: [
      'Large numbers',
      'Operations on numbers',
      'Factors and multiples',
      'Fractions',
      'Decimals',
      'Percentage basics',
      'Geometry',
      'Perimeter and area basics',
      'Measurement',
      'Time and calendar',
      'Money',
      'Data handling'
    ],
    English: [
      'Reading comprehension',
      'Parts of speech',
      'Tenses',
      'Prepositions',
      'Conjunctions',
      'Direct and indirect speech basics',
      'Punctuation',
      'Vocabulary',
      'Paragraph understanding',
      'Sentence transformation'
    ],
    Hindi: [
      'Reading comprehension',
      'Grammar',
      'Nouns',
      'Pronouns',
      'Verbs',
      'Adjectives',
      'Tenses',
      'Synonyms and antonyms',
      'Sentence correction',
      'Paragraph understanding'
    ],
    EVS: [
      'Human body systems basics',
      'Food and nutrition',
      'Plants and animals',
      'Water and air',
      'Natural resources',
      'Environment and pollution',
      'Maps and directions',
      'Transport and communication',
      'Safety and health'
    ],
    GK: [
      'Indian states and capitals',
      'National symbols',
      'Indian leaders',
      'Science and technology basics',
      'Sports',
      'Important days',
      'Environment',
      'World awareness basics'
    ]
  }
};
