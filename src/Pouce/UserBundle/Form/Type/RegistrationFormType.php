<?php

// src/Pouce/UserBundle/Form/Type/RegistrationFormType.php

namespace Pouce\UserBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

use Doctrine\ORM\EntityRepository;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        parent::buildForm($builder, $options);
        
        // add your custom field
        $builder
            ->remove('username')
            ->add('school', 'entity', array(
                'class' => 'PouceUserBundle:School',
                'property' => 'name',
                'label' => 'Ecole/Université',
                'query_builder' => function(EntityRepository $er) {
                    return $er->createQueryBuilder('c')
                        ->orderBy('c.name', 'ASC');
                },
            ));
    }

    public function getParent()
    {
        return 'fos_user_registration';
    }

    public function getName()
    {
        return 'pouce_user_registration';
    }
}