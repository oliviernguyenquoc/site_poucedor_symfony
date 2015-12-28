<?php

namespace Pouce\TeamBundle\Form;

use Symfony\Component\Form\FormBuilderInterface;

class ResultEditType extends ResultType
{

    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        // On fait appel à la méthode buildForm du parent, qui va ajouter tous les champs à $builder
        parent::buildForm($builder, $options);

        $builder->remove('position');
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_resultEdit';
    }
}
